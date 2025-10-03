# Initial Dashboard Plan

## Goal

Build a hackathon-ready BioQuery dashboard that delivers space bioscience intelligence in minutes. Focus on an unforgettable first-session experience, a powerful Discover chatbot core, and persistent artifacts that keep insights alive.

## Experience Principles

- **Guide, then empower**: Onboard users with a three-step tour that shows the value before asking for input.
- **Science-grade clarity**: Present insights with traceability to sources, confidence tags, and concise language.
- **Lightweight delight**: Use motion, holographic gradients, and ShadCN primitives sparingly to keep performance high.
- **Evolvable architecture**: Modular sections for RAG expansion, future knowledge graph overlays, and new tools.

## First-Time Flow

1. **Welcome modal** (full screen overlay): 2-sentence mission, CTA to begin tour.
2. **Guided highlights** (Spotlight on sidebar → Discover → Collections): uses Tooltip/Spotlight to explain layout.
3. **Discover prompt primer**: Pre-populate example question (“How do microgravity plant studies inform Mars missions?”). Short guide explaining data sources + confidentiality note.
4. **First response**: Auto-run primer query to demonstrate capabilities; offer “Teach me more” secondary actions.

## Information Architecture

- **Sidebar** (ShadCN `Sheet` on mobile): BioQuery logo, Discover, Collections, (future) Mission Control, Settings.
- **Top bar**: Session status indicator (online/indexed docs), quick actions (Start new chat, Upload study).
- **Primary views**:
  - Discover (default landing)
  - Collections (artifact library)
  - Artifact detail (modal/drawer)

## Page Blueprints

### Discover (Landing)

- **Hero state** (before first question): Centered chat input with animated cosmic background, quick suggestion chips, onboarding callout.
- **Conversation layout (after message)**:
  - Chat transcript left-aligned; assistant messages include summary panel, source list, metric chips.
  - Right rail (collapsible) showing: Related studies, knowledge graph mini preview, saved artifacts.
  - Composer pinned bottom with tool picker, text input, file attach.
- **Response anatomy**:
  - Executive summary block (use `Card` with subtle glow).
  - Insight bullets with evidence citations.
  - Action bar: Save as note, Generate visualization, Build comparison (future).
  - Optional knowledge graph preview image with “Open in Explorer”.

### Collections

- **Overview grid**: Tabs for `Notes`, `Knowledge Graphs`, `Visualizations`, `All`. Each item displayed with metadata (created, source count, tags).
- **Filters**: Study type, organism, mission phase, confidence.
- **Empty state**: Illustration with CTA to ask Discover to create first artifact.
- **Selection**: Clicking opens detail drawer with quick preview, share/export options.

### Artifact Detail (Drawer or full page)

- **Header**: Title, type badge, created timestamp, source count.
- **Content**: Render markdown/visualization/graph canvas.
- **Actions**: “Discuss with BioQuery”, “Export (PDF/PNG)”, “Add to Collection”.
- **Context**: Study tags, mission alignment, tooling audit (which tools were invoked).

### Knowledge Graph Explorer (embedded inside artifacts or Discover)

- **Canvas**: Force-directed graph using D3/Sigma in a `Card` with dark theme.
- **Controls**: Node type filter (Organism, Experiment, Outcome), timeline slider.
- **Insight rail**: Auto-generated takeaways from graph (top 3 connections, anomalies).
- **Integration**: Users can pin a subgraph and save as artifact.

## Data & AI Pipelines

- **RAG Core**: Query → semantic search (Supabase pgvector) → rerank → prompt synthesis.
- **Knowledge Graph**: Pre-process NASA dataset into entity/relation triples; store in graph DB or Supabase tables for JSON retrieval.
- **Artifact Persistence**: Save generated outputs (markdown, JSON spec, graph snapshots) in Supabase storage + metadata table.
- **Real-time updates**: Use Supabase channels if time permits for multi-session sync (optional).

## UI Stack & Components

- **Layout**: ShadCN `sidebar`, `breadcrumb`, `scroll-area`, `tabs`.
- **Chat**: Custom `ChatMessage` component with status chips (`Badge`), source accordions (`Accordion`).
- **Cards**: `Card` with tinted gradients for discovery hero, insights.
- **Graph preview**: `Card` with Canvas + overlay CTA.
- **Toolbar**: `Popover` for tool-picker, `Tooltip` for quick hints.
- **Animations**: Framer Motion for onboarding transitions, chat message fade-in.

## Prioritized Implementation (2.5 days)

- **Day 0.5**: Build sidebar + layout shell, stub Discover page hero and chat log.
- **Day 1**: Implement onboarding modal, guided steps, chat composer, integrate basic RAG call (mock if needed).
- **Day 1.5**: Add response cards with save-to-artifact action, build Collections list UI, create artifacts table schema.
- **Day 2**: Implement artifact detail drawer, knowledge graph preview component (placeholder data), wire Supabase storage flows.
- **Day 2.5**: Polish (animations, responsive, theming, empty states), prepare demo script and seed data.

## Success Criteria

- User understands app value within first 30 seconds.
- Able to ask a question, receive sourced insights, and save at least one artifact.
- Collections page shows saved artifact with detail view accessible.
- Knowledge graph preview communicates capability even if data is mocked.
- Codebase remains modular to extend post-hackathon.

