# Diagrams

## Pipeline Sequence

1. `PAPER_RECEIVED`
2. `EXTRACTING_CONCEPTS`
3. `CONCEPTS_READY`
4. `GENERATING_START` (per concept)
5. `VALIDATING` / `REPAIRING` as needed
6. `CONCEPT_READY`
7. `PIPELINE_COMPLETE`

## Interaction Route

1. Receive user message
2. Run input guard
3. Generate tutor response
4. Run output guard
5. Return safe response
