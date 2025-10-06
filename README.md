# BioQuery

BioQuery is an AI research copilot for exploring NASA space biology data. It combines conversational search, generated briefings, and immersive visualizations to help scientists, mission planners, and enthusiasts surface insights from decades of orbital life-science missions.

- Live app: https://bioquery.vercel.app
- Repository: https://github.com/zahemen9900/bioquery

## Key Capabilities

- Conversational discovery via the **Discover** page, with multi-turn chat, typing indicators, and inline source links.
- Rich tool call outputs including generated documents, interactive timelines, knowledge graphs, and quantitative visualizations. Each artifact opens in a dedicated modal with responsive two-panel layouts.
- **Collections** library that auto-organizes saved artifacts and documents, provides filtering by artifact type, and reuses the same high-fidelity viewers from Discover.
- Supabase-backed authentication, chat persistence, artifact storage, and user preference tracking (first-run onboarding, tutorial hints, tool tips).
- Responsive, theme-aware UI built with shadcn-inspired primitives, Radix Dialog/Popover/ScrollArea components, Tailwind CSS, and motion-powered transitions.

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **State & Data:** React Query, custom context providers, Supabase client SDK
- **UI System:** Tailwind CSS, Radix UI primitives, `motion` animations, `react-markdown` with `remark-gfm`
- **Backend-as-a-Service:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Data Visuals:** Custom timeline layout, knowledge graph renderer, chart generation helpers

## Project Structure

```
src/
  components/        Shared layout primitives, chat renderers, shadcn-based UI
  contexts/          Auth, chat, and theme providers
  hooks/             Media queries, theme helpers, preference hooks
  pages/             Route-level screens (discover, collections, auth, home)
  services/          Supabase-backed chat service helpers
  lib/               Supabase client, general utilities
supabase/
  migrations/        SQL migrations for documents, artifacts, preferences
documentation/       Product plans, design notes, onboarding guidance
```

Additional implementation notes are captured in `documentation/important/*.md` and the dashboard plan inside `documentation/dashboard/`.

## Getting Started

### Prerequisites

- Node.js 20.x or newer
- npm 10.x (bundled with Node 20) or another package manager of your choice
- A Supabase project with the migrations in `supabase/migrations` applied

### 1. Clone and Install

```bash
git clone https://github.com/zahemen9900/bioquery.git
cd bioquery
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the repo root with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Both values are required at runtime. The app throws a descriptive error if either value is missing.

### 3. Run Database Migrations (Optional for Local Mock Data)

If you want local parity with production, run the SQL migration files in `supabase/migrations` against your Supabase project (via the Supabase dashboard or CLI). These migrations create the `documents`, `chat_artifacts`, and supporting preference tables used by the UI.

### 4. Start the Development Server

```bash
npm run dev
```

Vite will boot on http://localhost:5173. The Discover and Collections routes are protected; you will need an authenticated Supabase user (email magic link or password depending on your project settings).

## Scripts

| Command           | Description                                |
|-------------------|--------------------------------------------|
| `npm run dev`     | Start Vite with hot module reloading       |
| `npm run build`   | Type-check with `tsc -b` then build assets |
| `npm run lint`    | Run ESLint across the entire codebase      |
| `npm run preview` | Preview the production build locally       |

## Deployment Notes

- The production deployment at https://bioquery.vercel.app runs on Vercel with the same Vite build.
- Ensure the environment variables above are configured in your Vercel project settings.
- Supabase security rules should restrict access to authenticated users; adjust Row Level Security policies to match your data governance requirements.

## Documentation

- `documentation/bioquery_app_plan.md` – product vision and feature goals
- `documentation/important/DASHBOARD_IMPLEMENTATION.md` – UI decisions and testing checklist
- `documentation/important/GOOGLE_OAUTH_SETUP.md` – identity provider configuration (if you enable Google sign-in)
- `documentation/important/TESTING_DASHBOARD.md` – manual QA playbook

## Contributing

Community feedback and contributions are welcome. Please open an issue to discuss sizeable changes before submitting a pull request. When contributing:

1. Create a branch off `main`.
2. Follow the existing coding style and Tailwind naming conventions.
3. Include screenshots or Loom recordings for UI-facing changes when possible.
4. Run `npm run lint` and ensure Supabase migrations (if modified) are documented.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.

---

_BioQuery helps make NASA space biology discoveries approachable, actionable, and inspiring. If you build something with it, let us know!_
