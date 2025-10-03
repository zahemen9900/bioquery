# BioQuery App — High-Level Code Structure & Purpose

## Vision

BioQuery is an interactive web platform designed to make NASA’s space biology research more accessible and actionable. The app will allow scientists, mission planners, and enthusiasts to explore decades of bioscience experiments conducted in space. It combines a clean, modern UI with powerful AI-driven search and visualization tools to surface insights that might otherwise remain buried in research papers.

The guiding idea: **make space biology feel discoverable, intuitive, and inspiring.**

---

## Purpose of the App

1. **Summarization & Discovery**

   * Help users quickly find relevant experiments and results without reading hundreds of papers.
   * Use RAG (Retrieval-Augmented Generation) to generate meaningful summaries based on user queries.

2. **Knowledge Graph Exploration**

   * Visualize relationships between studies, organisms, and conditions (e.g., microgravity, radiation).
   * Enable exploration of research trends, gaps, and connections.

3. **Accessible Design**

   * Provide a dashboard-style experience that feels modern and professional, in line with sites like Vercel or Cursor.
   * Ensure the interface is usable by both domain experts and newcomers.

---

## Project Structure (Starter Repo)

```
/src
  /components        # ShadCN-driven reusable UI components
  /features          # Feature-based modules (auth, search, graph, dashboard)
  /pages             # Top-level routes (Landing, Dashboard, Explore, Auth)
  /lib               # Utility modules (Supabase client, API helpers, embedding utils)
  /types             # TypeScript type definitions for articles, chunks, users

/supabase
  /migrations        # Database migrations (schema handled separately)
  /server            # Supabase Edge Functions
    search_publications.ts   # Vector search endpoint
    summarize.ts             # RAG summarization endpoint
    auth_hooks.ts            # Optional auth logic

/public              # Static assets (logos, icons, favicons)

```

---

## Feature Overview

### 1. Authentication

* Managed by Supabase Auth (email + magic link).
* Minimal UI: login, signup, logout.

### 2. Dashboard

* Central hub for queries.
* Search bar for natural language questions.
* Results: AI-generated summary + expandable chunks with source links.
* Filters (by organism, mission, year) in sidebar.

### 3. Explore (Knowledge Graph)

* Visualize studies, key terms, and their relationships.
* Powered by a lightweight graph visualization library (e.g., Cytoscape.js).
* Users can click nodes to see relevant publications.

### 4. UI / Design

* **ShadCN + Tailwind** for consistent styling.
* **Framer Motion** for subtle animations.
* Dark/light theme toggle built-in.
* Typography-driven layout for a professional, clean aesthetic.

---

## Development Philosophy

* **Feature-first organization** → group related code together under `/features`.
* **Composable UI components** → keep things modular for reuse.
* **Minimal boilerplate** → no over-engineering, just enough structure to scale.
* **Hackathon-friendly** → MVP first, polish later.

---

## Next Steps

1. Scaffold Vite + React project with Tailwind + ShadCN.
2. Add Supabase client setup in `/lib/supabase.ts`.
3. Implement placeholder pages (Landing, Dashboard, Explore).
4. Wire up a simple Edge Function (`search_publications.ts`) to return dummy data.
5. Iterate toward full RAG integration once embeddings are ready.

---

This structure ensures BioQuery starts simple but can expand gracefully, while keeping the **core purpose — discovery and exploration of space biology knowledge — at the heart of the build.**
