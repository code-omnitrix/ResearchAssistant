from collections import deque

from guardrails.input_guard import run_input_guard
from guardrails.output_guard import run_output_guard
from prompts.agent4_prompts import TUTOR_SYSTEM_PROMPT, MODE_TEMPLATES
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry


class TutorAgent:
    def __init__(self, max_history: int = 12):
        self.memory = deque(maxlen=max_history)

    @staticmethod
    def _detect_mode(message: str) -> str:
        msg = message.lower()
        if any(k in msg for k in ["what does", "explain", "i don't understand"]):
            return "clarification"
        if any(k in msg for k in ["go deeper", "technical", "details"]):
            return "deep_dive"
        if any(k in msg for k in ["simpler", "eli5", "too complicated"]):
            return "simplify"
        if any(k in msg for k in ["quiz", "test me"]):
            return "quiz"
        if any(k in msg for k in ["compare", "relate", "similar"]):
            return "connect"
        if any(k in msg for k in ["what next", "continue", "next concept"]):
            return "next"
        return "clarification"

    def respond(self, message: str, context: dict) -> str:
        guard = run_input_guard(message)
        if not guard.safe:
            return f"Input blocked by guardrails ({guard.category}): {guard.reason}"

        mode = self._detect_mode(message)
        mode_instruction = MODE_TEMPLATES.get(mode, MODE_TEMPLATES["clarification"])

        active_system = (
            f"{TUTOR_SYSTEM_PROMPT}\n\n"
            f"## ACTIVE RESPONSE MODE: {mode.upper()}\n"
            f"{mode_instruction}"
        )

        # Build viewport-aware context
        current_scene = context.get("currentScene", context.get("currentConcept", {}))
        all_scenes = context.get("allScenes", context.get("allConcepts", []))
        viewport = context.get("viewport", {})
        visible_ids = viewport.get("visibleSceneIds", [])
        prominent = viewport.get("mostProminentSceneId", "")
        selected = viewport.get("selectedElementId", "")

        viewport_section = ""
        if visible_ids:
            viewport_section = (
                f"\nVIEWPORT: Visible scenes: {', '.join(visible_ids)}"
                f"\n  Most prominent: {prominent or 'none'}"
                f"\n  Selected element: {selected or 'none'}"
            )

        payload = (
            f"PAPER: {context.get('paperMetadata', {}).get('title', 'Unknown')}\n"
            f"CURRENT SCENE: {current_scene.get('title', 'N/A')}\n"
            f"ALL SCENES: {', '.join([s.get('title', '') for s in all_scenes])}"
            f"{viewport_section}\n"
            f"USER MESSAGE: {message}"
        )

        self.memory.append({"role": "user", "content": message})

        try:
            model = get_openrouter_chat(temperature=0.3)
            response = invoke_with_retry(model, [
                {"role": "system", "content": active_system},
                *list(self.memory),
                {"role": "user", "content": payload},
            ])
            text = getattr(response, "content", "")
            if isinstance(text, list):
                text = "\n".join(str(item) for item in text)
        except Exception:
            text = "I can help explain the paper. Ask me about a concept, result, or method from the uploaded document."

        out_guard = run_output_guard(str(text))
        final_text = out_guard.corrected if not out_guard.safe and out_guard.corrected else str(text)
        self.memory.append({"role": "assistant", "content": final_text})
        return final_text


tutor_agent = TutorAgent()
