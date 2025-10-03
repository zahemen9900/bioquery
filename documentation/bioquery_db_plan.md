# BioQuery — Database Design & Structure

## Overview

BioQuery uses **Supabase (PostgreSQL)** as its primary data store. The database must power a conversational UI while persisting user profiles, preferences, chats, LLM tool interactions, and downstream artifacts. All feature tables live inside the `public` schema and integrate tightly with `auth.users`, enabling manual email/password auth in addition to Google OAuth.

The goals of this design:

- Treat chat as the canonical interaction surface, with dashboards as curated views over chat artifacts.
- Maintain a single source of truth for user identity by mirroring metadata from `auth.users` into `public.users`.
- Capture the lifecycle of every message, tool invocation, and generated deliverable for auditability.
- Stay extensible so that new copilots, dashboards, or data sources can join without rewiring auth.

---

## Schema Summary (all tables in `public`)

| Table | Purpose | Key Columns |
| --- | --- | --- |
| `users` | App-facing profile that mirrors `auth.users` | `id` (PK, UUID), `email`, `full_name`, `nickname`, `avatar_url`, `last_login_at` |
| `user_settings` | User preferences & product toggles | `user_id` (PK, FK → users.id), `preferred_theme`, `user_prefs` |
| `chats` | Chat sessions owned by a user | `id` (PK, UUID), `user_id`, `chat_name`, `created_at`, `date_last_modified` |
| `chat_messages` | Ordered messages inside a chat | `id` (PK, BIGSERIAL), `chat_id`, `sender`, `content`, `tool_calls`, `tool_contents`, `created_at` |
| `chat_artifacts` | Saved summaries, docs, or visuals | `id` (PK, BIGSERIAL), `chat_id`, `artifact_type`, `title`, `content`, `created_at` |
| `chat_message_chunks` *(optional extension)* | Prepared data for search/embeddings | `id`, `message_id`, `content`, `embedding_vector` |
| `chat_tool_events` *(optional extension)* | Normalized log of tool usage | `id`, `message_id`, `tool`, `payload`, `duration_ms` |

The optional tables are sketched for future-proofing and can be toggled on once retrievers or analytics require them.

---

## Core Table Definitions

### `public.users`

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    nickname TEXT,
    avatar_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX users_email_idx ON public.users (email);
```

*Mirrors `auth.users` while allowing app-specific metadata. `last_login_at` can be updated via webhook or sign-in event.*

### `public.user_settings`

```sql
CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    preferred_theme TEXT CHECK (preferred_theme IN ('light', 'dark')) DEFAULT 'light',
    user_prefs JSONB NOT NULL DEFAULT jsonb_build_object(
        'show_onboarding', true,
        'auto_summarize', true
    ),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
```

*Keeps settings lean with a JSONB column for flexible feature flags.*

### `public.chats`

```sql
CREATE TABLE public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    chat_name TEXT,
    date_last_modified TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX chats_user_idx ON public.chats (user_id, date_last_modified DESC);
```

### `public.chat_messages`

```sql
CREATE TABLE public.chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender TEXT CHECK (sender IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
    tool_contents JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX chat_messages_chat_id_idx ON public.chat_messages (chat_id, created_at DESC);
```

### `public.chat_artifacts`

```sql
CREATE TABLE public.chat_artifacts (
    id BIGSERIAL PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    artifact_type TEXT CHECK (artifact_type IN ('summary', 'document', 'visualization', 'dataset')) NOT NULL,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX chat_artifacts_chat_id_idx ON public.chat_artifacts (chat_id, created_at DESC);
```

### Optional Extensions

These tables stay disabled until needed:

- `public.chat_message_chunks`: store embedding vectors (`vector` type) for retrieval and hybrid search.
- `public.chat_tool_events`: normalized table for tool executions, enabling latency dashboards and billing.

---

## Row Level Security (RLS)

Enable RLS on every table and ship the following policies:

- `public.users`: users can `SELECT` / `UPDATE` their own row (`auth.uid() = id`).
- `public.user_settings`: users can `SELECT` / `UPDATE` where `auth.uid() = user_id`.
- `public.chats`: users can `SELECT` / `INSERT` / `UPDATE` / `DELETE` where `auth.uid() = user_id`.
- `public.chat_messages` & `public.chat_artifacts`: inherit access by joining through `chats` (policy uses `EXISTS` clause ensuring the chat is owned by `auth.uid()`).

Administrators (service role) bypass RLS for moderation and tooling jobs.

---

## Automatic Profile Provisioning

A trigger bridges Supabase auth with the `public` schema. Whenever a row is created in `auth.users`, the trigger:

1. Inserts/updates the mirrored profile in `public.users`.
2. Seeds `public.user_settings` with default preferences.
3. Captures the first `last_login_at` timestamp for audit trails.

The trigger function is defined in `supabase/migrations/20251003000100_init_bioquery.sql` (see below) so that new environments stay in sync.

---

## Migration Script

The migration at `supabase/migrations/20251003000100_init_bioquery.sql` performs the following:

1. Ensures required extensions (`pgcrypto`) exist for UUID generation.
2. Creates `public.users`, `public.user_settings`, `public.chats`, `public.chat_messages`, and `public.chat_artifacts` with indexes.
3. Enables RLS and installs owner-based access policies.
4. Declares the `public.handle_new_user()` function and trigger that mirror metadata from `auth.users` and insert default settings.
5. Provides helpers for updating `last_login_at` via Supabase auth hooks later.

Apply the migration with the Supabase CLI or directly via the SQL editor to bootstrap a fresh project.

---

## In-Chat Dashboards & Visualizations

- **Inline visualizations**: tool calls (e.g. `generate_graph`) return JSON specs rendered inline (Recharts, D3, Cytoscape, etc.).
- **Pinned dashboards**: a secondary UI surfaces saved summaries, comparisons, and pinned visuals filtered by mission, organism, or theme.
- **Hybrid**: inline first, with a “Pin to dashboard” action that stores artifacts in `public.chat_artifacts` for long-term access.

---

## Next Steps

- Finalize an artifact taxonomy per product milestone.
- Decide on storage for visualization payloads (raw JSON vs. rendered snapshots).
- Expand optional tables once embeddings and analytics are ready.

**Key Design Choice:** The chat remains the primary interface; dashboards act as curated knowledge hubs powered by the same relational core.
