# Tool-Calling Implementation Roadmap

## Sprint 0 — Database & Storage Foundations (Current Sprint)

- **Migrations**: Introduce `public.documents` for textual artifacts (including translated publications) and rebuild `public.chat_artifacts` for JSON-based outputs with tool-call anchors.
- **Storage**: Provision a Supabase Storage bucket named `generated-artifacts` with a 365-day lifecycle policy for generated images and media.
- **Tool Anchors**: Define schema support for tool call identifiers (`tool_call_id`, `message_id`) to map inline chat markers to persisted artifacts.
- **Generic Tool Consumer**: Scaffold a shared UI component to surface tool-call states (pending/success/error) while we develop specialized renderers later.

## Sprint 1 — Artifact Creation Tools

- **Tool Declarations**: Implement Gemini function declarations for `create_document`, `update_document`, `timeline_builder`, `create_visual_json`, and `create_knowledge_graph_json` with multi-tool support.
- **Execution Pipeline**: Extend the Supabase Edge function (`chat-stream`) to route tool calls, persist outputs into `public.documents` or `public.chat_artifacts`, and emit inline tool-call events with status updates.
- **Chat Context Updates**: Enrich `ChatContext` to manage parallel tool invocations, associate tool anchors with messages, and expose lifecycle hooks to the UI.
- **UI Rendering**: Update chat message rendering to show inline pending indicators, completion badges, and links to stored artifacts using the generic tool consumer.
- **Auditing & Logging**: Capture tool-call metadata (arguments, status, storage references) for debugging and analytics.

## Sprint 2 — Presentation & Extension Tools

- **Tool Declarations**: Add `generate_image` and `translate_publication` with parallel-call support.
- **Media Handling**: Wire image outputs to upload into `generated-artifacts`, store URIs with expiration metadata, and surface previews/download links in chat.
- **Localization Flow**: Persist translated publications into `public.documents` with language metadata; present inline diff/highlight UX.
- **Access Controls**: Confirm RLS policies cover media references and signed URL generation where required.

## Sprint 3 — Preprocessing Tools

- **Tool Declarations**: Implement `analyze_document` and `analyze_image` declarations and execution handlers.
- **Upload Pipeline**: Enable file ingestion (chunking, temporary storage) and connect analysis outputs to downstream tool orchestration.
- **UI Hooks**: Display analysis summaries inline, with affordances to trigger subsequent tools (e.g., knowledge-graph creation).
- **Error Handling**: Harden retry/backoff strategies for large file processing and reflect state in chat UI.

## Sprint 4 — Retrieval & Answer Tools

- **Tool Declarations**: Finalize `contextual_search` and `answer_with_sources` with support for chained calls within a single turn.
- **Vector Store Integration**: Connect to pgvector-backed retrieval (ensure embedding sync), manage caching, and feed results into Gemini for grounded answers.
- **Citation Enrichment**: Reuse existing citation UI for sourced answers, integrating with context metadata returned by tools.
- **Testing & Observability**: Build integration tests for multi-tool sequences and add monitoring for latency/failure metrics.

## Cross-Cutting Considerations

- **Multi-Tool Turns**: Ensure conversation transcript wiring replays model responses (including thought signatures) so Gemini can invoke several tools concurrently.
- **Tool Result Registry**: Maintain a normalized mapping from `tool_call_id` to persisted artifacts and storage objects; expose fetch endpoints for the UI.
- **Security**: Review RLS, storage policies, and signed URL expirations to protect user data.
- **Documentation**: Update developer docs with tool schemas, data contracts, and UI conventions once each sprint completes.
