# BioQuery — Execution Plan (Initial Sprints)

## Plan Purpose

Deliver an actionable roadmap for the BioQuery MVP, aligning engineering, design, and data setup so we can iterate quickly toward a conversational research assistant for NASA bioscience.

## Guiding Pillars

- **Chat-first experience** with rich artifacts and inline visualizations.
- **Premium, minimalist UI** powered by Tailwind CSS, ShadCN, and Framer Motion.
- **Supabase-backed stack** handling auth, vector search endpoints, and artifact persistence.
- **Incremental RAG integration** so we can demo quickly with mock data, then swap in real embeddings.
NB from Boss: Real embeddings already exist so I prefer to use that first

## Core Assumptions

- Wireframe code for the Home page already exists and will live under `src/pages/home` (or equivalent) as the starting point for the dashboard shell.
- Supabase project credentials will be available by Sprint 1 for local development.
- Team capacity supports 1-week sprints with overlapping design + engineering workstreams.
- Tailwind CSS is the primary styling system; component work should extend ShadCN primitives.

## Sprint Breakdown

### Sprint 0 — Project Scaffolding & Tooling (Week 0)

#### Sprint 0 Goals

- Stand up the codebase foundation with Vite + React.
- Integrate Tailwind CSS, ShadCN UI, and base theming.
- Establish repo hygiene (ESLint, Prettier, commit hooks) and CI smoke checks.

#### Sprint 0 Key Tasks

- Generate Vite React project with TypeScript.
- Configure Tailwind, PostCSS, and Tailwind-friendly Prettier settings.
- Install ShadCN CLI, seed foundational components (Button, Card, Input, Sidebar shell).
- Add project structure (`/src/components`, `/src/features`, `/src/pages`, `/src/lib`, `/src/types`).
- Migrate existing Home page wireframe into `src/pages/home`, wrapping it in new layout primitives.
- Set up GitHub Actions (or equivalent) to run `pnpm lint` / `pnpm test` on PR.

#### Sprint 0 Deliverables

- Running dev server with Tailwind + ShadCN styles.
- Documented project structure in `README.md` section.
- Automated lint/test pipeline green.

### Sprint 1 — Chat Shell & Supabase Foundations (Week 1)

#### Sprint 1 Goals

- Implement authenticated layout and chat surface stub.
- Connect Supabase client and mock vector search Edge Function.
- Store conversations locally (frontend state) while database migrations are prepared.

#### Sprint 1 Key Tasks

- Implement auth views (login/signup) using Supabase Auth UI primitives.
- Create `SupabaseClient` helper under `src/lib/supabase.ts` with env-driven config.
- Scaffold chat interface with message bubbles, input composer, and placeholder artifact cards.
- Implement basic theming toggle (light/dark) leveraging Tailwind + ShadCN.
- Add Supabase Edge Function placeholders (`summarize.ts`, `search_publications.ts`) returning mocked data.
- Draft SQL migrations for `users`, `user_settings`, `chats`, `chat_messages`, `chat_artifacts` under `/supabase/migrations`.

#### Sprint 1 Deliverables

- Login → Chat flow functional using mock data.
- Supabase client integration tested via local `.env.local`.
- Database migration files ready for review.
- Updated docs describing how to run Supabase locally.

### Sprint 2 — Persistent Chats & Artifact System (Week 2)

#### Sprint 2 Goals

- Persist conversations and artifacts to Supabase.
- Surface saved artifacts within the UI (sidebar + detail view).
- Prepare Dashboard tab for pinning visualizations.

#### Sprint 2 Key Tasks

- Wire chat composer to Supabase RPC or REST calls hitting Edge Functions.
- Implement CRUD operations for chats, messages, artifacts.
- Build Saved Artifacts sidebar module with filtering controls (organism, mission, year).
- Create dashboard grid view for artifacts with Tailwind cards and hover interactions.
- Add analytics logging (simple event tracking) to measure feature use.

#### Sprint 2 Deliverables

- Conversations fully round-trip stored in Supabase.
- Artifact pinning and viewing experience live.
- Documentation updates covering data flows and API contracts.

### Sprint 3 — Knowledge Graph & Visualization UX (Week 3)

#### Sprint 3 Goals

- Integrate lightweight graph visualization (e.g., Cytoscape.js) within Explore tab.
- Allow graph nodes to open artifact summaries and link back to chats.
- Polish UI with Framer Motion transitions and micro-interactions.

#### Sprint 3 Key Tasks

- Implement Explore page under `src/pages/explore` with graph component.
- Define data schema for graph responses in `src/types/graph.ts`.
- Create React hooks in `src/features/graph` to fetch and manage graph state.
- Add Framer Motion transitions for page navigation and card reveals.
- Refine Tailwind themes, ensure responsive breakpoints for mobile/tablet.

#### Sprint 3 Deliverables

- Interactive knowledge graph connected to mock or real data.
- Seamless navigation between Chat ↔ Explore ↔ Dashboard.
- Updated design documentation showcasing animations and interactions.

## Cross-Sprint Workstreams

- **QA & Testing**: Add unit tests (Vitest) and integration tests (Playwright) incrementally each sprint.
- **Accessibility**: Ensure semantic HTML, focus management, and theme contrast from Sprint 0 onward.
- **Performance**: Monitor bundle size, lazy-load heavy components (graph, Lottie) by Sprint 2.
- **Content & Tutorials**: Create onboarding copy, tooltips, and quickstart guides in parallel.

## Communication Cadence

- Sprint planning every Monday with prioritization review.
- Mid-sprint async check-in (Slack/Linear update).
- Sprint review + demo on Fridays, capturing feedback and backlog adjustments.

## Metrics for Success

- **Sprint 0**: Dev environment reproducible within 10 minutes.
- **Sprint 1**: Authenticated chat demo delivering mocked answer within 5 seconds.
- **Sprint 2**: Artifact persisted and retrievable across sessions.
- **Sprint 3**: Knowledge graph load time < 2 seconds for default dataset.

## Next Immediate Actions

1. Confirm sprint staffing and availability.
2. Lock Tailwind color tokens and typography scale.
3. Kick off Sprint 0 tasks starting with repo scaffold and toolchain setup.
