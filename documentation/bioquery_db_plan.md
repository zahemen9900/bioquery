# BioQuery — Database Design & Structure

## Overview

The BioQuery database is designed to support a **chat-first interface** where users interact with NASA’s bioscience research through a conversational UI. Beyond just storing research embeddings, it must manage users, their preferences, conversations, and any artifacts (summaries, generated docs, visualizations) created through tool calls. The design emphasizes extensibility so we can evolve the chat experience into a full research dashboard.

---

## Core Tables

### 1. **Users**

Holds core user information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    nickname TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **User Settings**

Stores preferences and app behavior controls.

```sql
CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_theme TEXT CHECK (preferred_theme IN ('light','dark')) DEFAULT 'light',
    user_prefs JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

* `user_prefs` will store flexible settings like whether to show tour popups.

### 3. **Chats**

Represents a chat session.

```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    chat_name TEXT,
    date_last_modified TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **Chat Messages**

Stores messages within a chat session.

```sql
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender TEXT, -- 'user' or 'assistant' (LLM)
    content TEXT,
    tool_calls JSONB DEFAULT '[]'::jsonb, -- logs tool call inputs
    tool_contents JSONB DEFAULT '[]'::jsonb, -- logs tool outputs
    created_at TIMESTAMP DEFAULT NOW()
);
```

* `tool_calls` and `tool_contents` allow storing the lifecycle of in-chat actions (summarizations, queries, visualizations).

### 5. **Chat Artifacts**

Represents generated content attached to chats (summaries, documents, etc.).

```sql
CREATE TABLE chat_artifacts (
    id BIGSERIAL PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    artifact_type TEXT, -- e.g., 'summary', 'document', 'visualization'
    title TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

* Enables BioQuery to store persistent research artifacts users can revisit.

---

## In-Chat Dashboards & Visualizations

### Idea 1: **Inline Visualizations in Chat**

* Allow certain tool calls (e.g., `generate_graph`) to return JSON describing a visualization.
* Client renders inline using React libraries (e.g., Recharts, D3, Cytoscape.js).
* Appears as a “card” inside the chat history — feels natural in conversation.

### Idea 2: **Pinned Dashboards**

* A dedicated **Dashboard tab** outside of chat where:

  * Users can see saved summaries, artifacts, and visualizations in one place.
  * Filter by mission, organism, or theme.
  * Compare across multiple chat sessions.

### Idea 3: **Hybrid Approach**

* Default experience: visualizations inside chat (feels conversational).
* Option to **“pin to dashboard”** → moves a visualization or summary into the Dashboard tab for persistent access.

---

## Next Steps

* Finalize **artifact taxonomy** (what types of artifacts can be generated?).
* Decide how **visualization schemas** will be stored (raw JSON for graphs, or rendered snapshots).
* Explore how the Dashboard can be structured: quick insights vs deep dives.

---

**Key Design Choice:** The chat is the *primary interface*, but the dashboard acts as a *secondary knowledge hub* where artifacts and insights live beyond the conversation.
