# Dashboard Tooling Plan

## Overview

Empower the Discover chatbot with a focused toolbelt that amplifies NASA bioscience exploration while staying buildable within 2.5 days. Each tool returns structured outputs the UI can render instantly, with clear responsibility boundaries and minimal dependencies.

## Tool Catalog

### Tool: create_summary

- **Purpose**: Condense multi-document RAG results into a short briefing or deep-dive note, ready for saving as an artifact.
- **Inputs**: `query`, `focus` ("brief" | "detailed"), `sources` (array of doc chunks with citations), `tone` ("technical" | "executive").
- **Outputs**: Markdown string with sections (Overview, Key Findings, Implications, Citations) plus metadata (reading_time, confidence_score).
- **UX tie-in**: Populates the primary assistant answer and enables “Save as Note” action.
- **Implementation**: Prompt template with guardrails, optional post-processing to enforce headings.

### Tool: generate_image

- **Purpose**: Produce illustrative imagery (mission patch, conceptual graphic) supporting summaries or presentations.
- **Inputs**: `prompt`, `style` ("infographic" | "poster" | "icon"), `context_tags` (e.g., organism, mission phase).
- **Outputs**: Storage reference (Supabase bucket path), thumbnail URL, alt-text, model metadata.
- **UX tie-in**: Action chip “Create mission visual” inside responses; stored under Collections → Visualizations.
- **Implementation**: Call out to hosted image model (invoke supabase edge function); ensure async status handling.

### Tool: build_graph_data

- **Purpose**: Assemble entity/relationship JSON for dynamic knowledge graph rendering.
- **Inputs**: `seed_entities` (array), `scope` ("microgravity" etc.), `depth` (1-3 hops), `filters` (entity types, year range).
- **Outputs**: `{ nodes: [...], edges: [...], metrics: {density, central_nodes}, summary_insights }`.
- **UX tie-in**: Feeds Knowledge Graph Explorer preview, enables artifact creation from pinned subgraphs.
- **Implementation**: Query pre-built triple store tables; optionally enrich with embedding similarity; cache results.

### Tool: compile_visualization

- **Purpose**: Convert structured findings into a visualization spec (e.g., D3 or Observable Plot) for charts and timelines.
- **Inputs**: `dataset` (array of datapoints), `chart_type`, `insight_goal`, optional `comparison_baseline`.
- **Outputs**: Visualization spec JSON (type, encoding, interactions), textual caption, recommended color palette.
- **UX tie-in**: Drives “Generate chart” actions; rendered inline using reusable Visualization component.
- **Implementation**: LLM drafts spec, server validates schema before returning to client.

### Tool: extract_key_metrics

- **Purpose**: Pull quantifiable outcomes (e.g., expression change, mission duration) into structured records.
- **Inputs**: `sources` (doc chunk objects), `metric_targets` (list of metric names/units), `confidence_threshold`.
- **Outputs**: Array of `{metric, value, unit, context, citation, confidence}` entries.
- **UX tie-in**: Feeds metric chips in responses and powers comparisons across artifacts.
- **Implementation**: Pattern-matching prompts with verification step; fallback to "metric unavailable" handling.

### Tool: fetch_related_studies

- **Purpose**: Retrieve a curated list of studies, datasets, and NASA resources linked to the user query.
- **Inputs**: `query`, `limit`, `filters` (organism, environment, year), `relation_focus` ("supporting", "contrasting").
- **Outputs**: List of study cards `{title, summary, source_url, mission, tags, relevance_score}`.
- **UX tie-in**: Populates right-rail “Related Studies” and suggestions for follow-up questions.
- **Implementation**: Hybrid search (vector + keyword) against Supabase metadata tables and OSDR API.

### Tool: analyze_document

- **Purpose**: Analyze the documents the user uploads and provide a detailed explanatation of what was analyzed.
- **Inputs**: several document types as supported by the Google `GenAI` API. Majorly supported ones are images (`png/jpeg/jpg`), and PDFs.
- **Outputs**: List of study cards `{title, summary, source_url, mission, tags, relevance_score}`.
- **UX tie-in**: Populates right-rail “Related Studies” and suggestions for follow-up questions.
- **Implementation**: Hybrid search (vector + keyword) against Supabase metadata tables and OSDR API.

## Tool Orchestration

- **Priority order**: fetch_related_studies → create_summary → extract_key_metrics → build_graph_data → compile_visualization → generate_image (optional).
- **Invocation model**: Use function-calling capable LLM; include explicit cost/time estimates so agent can skip heavyweight tools under latency pressure.
- **State sharing**: Persist tool outputs per chat turn to enable artifact creation without re-running tools.
- **Safety checks**: Validate outputs (JSON schema, markdown sanitization), enforce source citations.

## Implementation Roadmap

1. Scaffold TypeScript interfaces for tool IO contracts shared across server/client.
2. Implement API routes or edge functions for each tool, starting with summary, document analyses and related studies.
3. Add tool picker UI in chat composer with loading states and cancellation.
4. Store tool invocation logs per artifact for transparency.
5. Prepare fallback messaging when a tool errors or exceeds time budget.

NB By Author: an important param to include for all tools is `tags`. this will help the user to perform searches across all related artifact types based on what they're searching for.