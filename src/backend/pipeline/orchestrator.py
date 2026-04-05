import asyncio
import functools
from collections.abc import AsyncGenerator
from io import BytesIO

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

# ── Sub-agents for the new parallel Phase A ──────────────────────────────────
from agents.paper_classifier  import classify_paper
from agents.equation_extractor import extract_equations
from agents.concept_sequencer  import sequence_concepts
from agents.scene_planner      import plan_scenes

# ── Phase B: parallel artifact + prose generation ─────────────────────────────
from agents.html_generator   import generate_html_for_concept, fallback_html
from agents.prose_generator  import generate_prose
from agents.repair_agent     import repair_html_artifact
from agents.validator        import validate_html_artifact
from agents.graph_builder    import build_graph
from guardrails.input_guard  import run_input_guard
from utils.logger import get_logger, log_event

logger = get_logger("backend.pipeline.orchestrator")


PIPELINE_EVENTS = {
    "PAPER_RECEIVED":     {"stage": 1, "message": "Paper received, beginning analysis..."},
    "PLANNING_START":     {"stage": 1, "message": "Analyzing paper structure..."},
    "CLASSIFYING":        {"stage": 1, "message": "Classifying paper domain and type..."},
    "EXTRACTING_MATH":    {"stage": 1, "message": "Extracting equations from paper..."},
    "SEQUENCING":         {"stage": 1, "message": "Building pedagogical concept sequence..."},
    "PLANNING_SCENES":    {"stage": 1, "message": "Planning scene layouts and visualisations..."},
    "SCENE_GRAPH_READY":  {"stage": 1, "message": "Scene graph ready"},
    "GRAPH_READY":        {"stage": 1, "message": "Knowledge graph edges extracted"},
    "SCENE_GENERATING":   {"stage": 2, "message": "Generating scene content..."},
    "GENERATING_RETRY":   {"stage": 2, "message": "Retrying with simplified prompt..."},
    "ARTIFACT_READY":     {"stage": 3, "message": "Artifact generated"},
    "PROSE_READY":        {"stage": 3, "message": "Prose generated"},
    "VALIDATING":         {"stage": 3, "message": "Validating artifact..."},
    "REPAIRING":          {"stage": 4, "message": "Repairing artifact..."},
    "SCENE_READY":        {"stage": 5, "message": "Scene fully rendered"},
    "CONNECTOR_READY":    {"stage": 5, "message": "Scene connector ready"},
    "CONCEPT_ERROR":      {"stage": 5, "message": "Concept generation failed"},
    "PIPELINE_COMPLETE":  {"stage": 6, "message": "Pipeline complete"},
    "PIPELINE_ERROR":     {"stage": 0, "message": "Pipeline error"},
}

_PHASE_COLORS = {
    "HOOK":        "#e8a020",
    "FOUNDATION":  "#3d8ef0",
    "MECHANISM":   "#00c49a",
    "EVIDENCE":    "#9575f0",
    "IMPLICATIONS":"#f06080",
    "SYNTHESIS":   "#e8a020",
}


def _extract_pdf_text(pdf_bytes: bytes, page_limit: int = 200) -> str:
    if PdfReader is None:
        raise RuntimeError("pypdf is not installed")
    reader = PdfReader(BytesIO(pdf_bytes))
    chunks = [page.extract_text() or "" for page in reader.pages[:page_limit]]
    return "\n".join(chunks).strip()


async def _run_phase_a(text: str) -> tuple[dict, list[dict], list[dict], list[dict]]:
    """
    Phase A — parallel decomposition into 4 focused sub-agent calls.

    Execution timeline:
      t=0  → 1A (classifier) starts immediately          [~4 s, 1 200 tokens]
      t=0  → 1B (equation extractor) starts immediately  [~10 s, 8 500 tokens]
      t=4  → 1C (concept sequencer) starts after 1A      [~12 s, 10 000 tokens]
      t=16 → 1D (scene planner) starts after 1B+1C done  [~8 s, 4 000 tokens]

    Total wall-clock ≈ 24 s vs ≈ 40 s for the old single megacall.
    """
    loop = asyncio.get_event_loop()

    # 1A: classify from abstract/intro only — fast, run first so 1C can use it
    classification = await loop.run_in_executor(
        None, functools.partial(classify_paper, text)
    )

    # 1B + 1C in parallel — both can start now that we have classification
    equations, concepts = await asyncio.gather(
        loop.run_in_executor(None, functools.partial(extract_equations, text)),
        loop.run_in_executor(None, functools.partial(sequence_concepts, text, classification)),
    )

    # 1D: scene planner — no raw paper text, uses distilled outputs only
    scenes = await loop.run_in_executor(
        None, functools.partial(plan_scenes, classification, concepts, equations)
    )

    return classification, equations, concepts, scenes


async def agentic_generate(pdf_bytes: bytes, paper_id: str = "p1") -> AsyncGenerator[dict, None]:
    log_event(logger, "pipeline_start", paper_id=paper_id, bytes=len(pdf_bytes))
    yield {"type": "PAPER_RECEIVED", "paperId": paper_id, **PIPELINE_EVENTS["PAPER_RECEIVED"]}

    # ── Extract raw text ──────────────────────────────────────────────────────
    try:
        text = _extract_pdf_text(pdf_bytes)
    except Exception as exc:
        log_event(logger, "pipeline_pdf_extraction_failed", error=str(exc))
        yield {"type": "PIPELINE_ERROR", "message": f"Failed to extract PDF text: {exc}"}
        return

    guard = run_input_guard(text)
    if not guard.safe:
        yield {"type": "PIPELINE_ERROR", "message": f"Input blocked: {guard.category} — {guard.reason}"}
        return

    # ── Phase A: parallel planning ────────────────────────────────────────────
    yield {"type": "CLASSIFYING",     **PIPELINE_EVENTS["CLASSIFYING"]}
    yield {"type": "EXTRACTING_MATH", **PIPELINE_EVENTS["EXTRACTING_MATH"]}
    yield {"type": "SEQUENCING",      **PIPELINE_EVENTS["SEQUENCING"]}

    try:
        classification, equations, concepts, scenes = await _run_phase_a(text)
    except Exception as exc:
        log_event(logger, "pipeline_phase_a_failed", error=str(exc))
        yield {"type": "PIPELINE_ERROR", "message": f"Phase A failed: {exc}"}
        return

    paper_metadata = {
        "title":               classification.get("title", ""),
        "authors":             classification.get("authors", []),
        "year":                classification.get("year", ""),
        "domain":              classification.get("domain", ""),
        "type":                classification.get("type", "HYBRID"),
        "mathematical_intensity": classification.get("math_intensity", "medium"),
        "difficulty":          classification.get("difficulty", "advanced"),
        "core_contribution":   classification.get("core_contribution", ""),
        "why_it_matters":      classification.get("why_it_matters", ""),
        "estimated_study_time":classification.get("estimated_study_time", ""),
    }

    log_event(logger, "pipeline_phase_a_complete",
              title=paper_metadata.get("title"),
              concept_count=len(concepts),
              equation_count=len(equations),
              scene_count=len(scenes))

    yield {
        "type":    "SCENE_GRAPH_READY",
        "paperId": paper_id,
        "payload": {
            "paper_metadata":    paper_metadata,
            "concept_sequence":  concepts,
            "equations":         equations,
            "scenes":            scenes,
        },
        "totalScenes": len(scenes),
        "stage": 1,
    }

    # ── Knowledge graph edges (unchanged) ────────────────────────────────────
    try:
        graph = build_graph(concepts)
    except Exception as exc:
        log_event(logger, "pipeline_graph_builder_failed", error=str(exc))
        graph = {"edges": [], "layout_hints": {}}
    log_event(logger, "pipeline_graph_ready", edges=len(graph.get("edges", [])))

    yield {
        "type":         "GRAPH_READY",
        "paperId":      paper_id,
        "nodes":        [c.get("id") for c in concepts],
        "edges":        graph.get("edges", []),
        "layout_hints": graph.get("layout_hints", {}),
        "stage": 1,
    }

    # ── Phase B: parallel artifact + prose per scene ────────────────────────────
    scene_by_id = {s.get("id"): s for s in scenes}
    # Truncate paper text for prose context (first ~8000 chars)
    paper_excerpt = text[:8000]

    previous_titles: list[str] = []
    prev_scene_id: str | None = None

    for idx, concept in enumerate(concepts):
        concept_id = concept.get("id", f"concept_{idx + 1:03d}")
        title = concept.get("title", f"Concept {idx + 1}")

        scene = scene_by_id.get(concept_id, {})
        if scene.get("canvas_x") is not None:
            position = {"x": scene["canvas_x"], "y": scene["canvas_y"]}
        else:
            hints  = graph.get("layout_hints", {}).get(concept_id, {})
            layer  = hints.get("layer", idx)
            column = hints.get("column", 0)
            position = {"x": 240 + column * 500, "y": 80 + layer * 420}

        # Merge scene-level artifact spec into concept for html_generator
        if scene.get("artifact"):
            concept = {**concept, **scene}

        yield {
            "type":         "SCENE_GENERATING",
            "sceneId":      concept_id,
            "title":        title,
            "paperId":      paper_id,
            "stage": 2,
        }
        log_event(logger, "scene_generation_start", scene_id=concept_id, title=title, index=idx)

        # ── Parallel: artifact generation (with retries) + prose generation ──

        async def _generate_artifact(c, pm, ci, tc, pt):
            """Run artifact generation with up to 3 attempts, returning (html, quality)."""
            loop = asyncio.get_event_loop()
            best_html = fallback_html(c)
            best_quality = 0
            artifact_spec = c.get("artifact_spec") or c.get("artifact", {})
            exp_w = artifact_spec.get("width", 0)
            exp_h = artifact_spec.get("height", 0)

            for attempt in range(3):
                try:
                    html = await loop.run_in_executor(
                        None,
                        functools.partial(
                            generate_html_for_concept, c, pm,
                            concept_index=ci, total_concepts=tc,
                            previous_titles=list(pt), attempt=attempt,
                        ),
                    )
                except Exception as exc:
                    log_event(logger, "artifact_gen_error",
                              scene_id=c.get("id"), attempt=attempt + 1, error=str(exc))
                    continue

                report = await loop.run_in_executor(
                    None, functools.partial(validate_html_artifact, html, exp_w, exp_h)
                )
                candidate_html = html
                candidate_quality = report.quality_score

                if report.verdict != "PASS":
                    try:
                        repaired = await loop.run_in_executor(
                            None, functools.partial(repair_html_artifact, html, report)
                        )
                        repaired_report = await loop.run_in_executor(
                            None, functools.partial(validate_html_artifact, repaired, exp_w, exp_h)
                        )
                        if repaired_report.quality_score >= candidate_quality:
                            candidate_html = repaired
                            candidate_quality = repaired_report.quality_score
                    except Exception as exc:
                        log_event(logger, "artifact_repair_error",
                                  scene_id=c.get("id"), error=str(exc))

                if candidate_quality > best_quality:
                    best_html = candidate_html
                    best_quality = candidate_quality

                if candidate_quality >= 60:
                    break

            return best_html, best_quality

        async def _generate_prose(sc, eqs, excerpt):
            """Run prose generation in executor, never raises."""
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None, functools.partial(generate_prose, sc, eqs, excerpt)
            )

        # Fire both in parallel
        artifact_result, prose_result = await asyncio.gather(
            _generate_artifact(concept, paper_metadata, idx, len(concepts), previous_titles),
            _generate_prose(scene, equations, paper_excerpt),
            return_exceptions=True,
        )

        # Handle partial failures
        if isinstance(artifact_result, Exception):
            log_event(logger, "artifact_task_exception", scene_id=concept_id, error=str(artifact_result))
            best_html, best_quality = fallback_html(concept), 0
        else:
            best_html, best_quality = artifact_result

        if isinstance(prose_result, Exception):
            log_event(logger, "prose_task_exception", scene_id=concept_id, error=str(prose_result))
            from agents.prose_generator import _default_prose
            prose_data = _default_prose(scene)
        else:
            prose_data = prose_result

        # ── Emit individual ready events, then combined SCENE_READY ───────────

        artifact_dims = scene.get("artifact", {})
        yield {
            "type":         "ARTIFACT_READY",
            "sceneId":      concept_id,
            "paperId":      paper_id,
            "artifactHtml": best_html,
            "dimensions":   {
                "w": artifact_dims.get("width", 580),
                "h": artifact_dims.get("height", 340),
            },
            "stage": 3,
        }

        yield {
            "type":            "PROSE_READY",
            "sceneId":         concept_id,
            "paperId":         paper_id,
            "proseBlocks":     prose_data.get("prose_blocks", []),
            "formulaBlocks":   prose_data.get("formula_blocks", []),
            "callouts":        prose_data.get("callouts", []),
            "stage": 3,
        }

        yield {
            "type":         "SCENE_READY",
            "sceneId":      concept_id,
            "sceneTitle":   title,
            "paperId":      paper_id,
            "artifactHtml": best_html,
            "proseBlocks":  prose_data.get("prose_blocks", []),
            "formulaBlocks":prose_data.get("formula_blocks", []),
            "callouts":     prose_data.get("callouts", []),
            "quality":      best_quality,
            "position":     position,
            "sceneSpec":    scene,
            "fullyRendered":True,
            "stage": 5,
        }

        # Emit connector to previous scene
        if prev_scene_id is not None:
            yield {
                "type": "CONNECTOR_READY",
                "from": prev_scene_id,
                "to":   concept_id,
                "connectorType": "sequential",
                "paperId": paper_id,
                "stage": 5,
            }

        log_event(logger, "scene_generation_complete",
                  scene_id=concept_id, quality=best_quality)
        previous_titles.append(title)
        prev_scene_id = concept_id

    yield {"type": "PIPELINE_COMPLETE", "paperId": paper_id,
           "totalScenes": len(concepts), "stage": 6}
    log_event(logger, "pipeline_complete", paper_id=paper_id, total_scenes=len(concepts))
