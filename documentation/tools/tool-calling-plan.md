# Tool Calling Implementation Plan

## Sprint 1 — Artifact Creation Tools (current sprint)

- **Database foundations**: create `documents` table for `create_document` and `translate_publication` outputs; rebuild `chat_artifacts` to store JSON payloads plus tag list for tools like `timeline_builder`, `create_visual_json`, `create_knowledge_graph_json`.
- **Storage prep**: provision Supabase bucket `generated-artifacts` with 365-day object lifecycle for generated images.
- **Edge Function plumbing**: extend chat-stream function with function declarations for artifact-creation tools, mirroring patterns in `supabase/functions/functions-copy`. Ensure multi-tool invocations per turn and capture tool call markers (e.g., `tool_calls` vs `tool_results`).
- **Persistence handlers**: implement server-side executors that write tool outputs into the new tables and return lightweight references (ids, signed URLs) for the frontend renderer.
- **Frontend transport**: extend chat message schema to hold tool call identifiers, pending/completed status, and artifact references; ensure NDJSON stream encodes `[tool:n]` markers consistently.
- **Generic tool consumer**: implement reusable React component that listens for tool events, renders pending state inline, and hyperlinks stored artifacts (documents table rows or storage objects).
- **Testing**: add unit/integration coverage for Supabase function handlers, verify lint/build.

## Sprint 2 — Presentation & Extension Tools

- Wire up `generate_image` to storage bucket; include signed URL generation and UI thumbnail rendering.
- Add UI components for presenting timeline/graph/visualization artifacts (consuming `chat_artifacts`).
- Introduce moderation or size guards for rich media outputs; confirm pending-state UX parity with Sprint 1.

## Sprint 3 — Preprocessing Tools

- Implement `analyze_document` and `analyze_image` execution paths, including storage ingestion (signed URLs, caching) and artifact storage when needed.
- Update frontend upload flows to index attachments and surface analysis summaries inline using the generic tool consumer.

## Sprint 4 — Retrieval & RAG Tools

- Implement `contextual_search` and `answer_with_sources`, persist retrieved context references, and surface citations.
- Ensure chat-stream orchestrator supports sequential/parallel tool calls with state tracking across turns.

## Cross-Sprint Considerations

- Maintain consistent tool metadata schema (tool id, array index, offsets) so chat replay renders deterministically.
- Reuse shared helpers from `functions-copy` (tool declarations, executor structure) to minimize divergence.
- Document API contracts for each tool (inputs, outputs, persistence) and update onboarding docs.
- Plan for migration rollout: coordinate Supabase migration order, bucket creation, and environment variable requirements.
