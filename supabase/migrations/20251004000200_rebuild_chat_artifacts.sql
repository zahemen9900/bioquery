-- Migration: rebuild chat_artifacts table for structured tool outputs
set check_function_bodies = off;

drop table if exists public.chat_artifacts cascade;

create table public.chat_artifacts (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid not null references public.chats (id) on delete cascade,
    message_id bigint references public.chat_messages (id) on delete set null,
    user_id uuid not null references public.users (id) on delete cascade,
    tool_call_id text,
    tool_name text not null,
    artifact_type text not null check (artifact_type in ('knowledge_graph', 'visualization', 'timeline', 'composite', 'custom')),
    content jsonb not null,
    tags text[] not null default '{}',
    source_uri text,
    metadata jsonb not null default '{}',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index chat_artifacts_chat_idx
    on public.chat_artifacts (chat_id, created_at desc);

create index chat_artifacts_tool_call_idx
    on public.chat_artifacts (tool_call_id);

create index chat_artifacts_tags_gin_idx
    on public.chat_artifacts using gin (tags);

alter table public.chat_artifacts enable row level security;

create policy "Users view their chat artifacts" on public.chat_artifacts
    for select using (user_id = auth.uid() or auth.role() = 'service_role');

create policy "Users insert their chat artifacts" on public.chat_artifacts
    for insert with check (user_id = auth.uid() or auth.role() = 'service_role');

create policy "Users update their chat artifacts" on public.chat_artifacts
    for update using (user_id = auth.uid() or auth.role() = 'service_role')
    with check (user_id = auth.uid() or auth.role() = 'service_role');

create policy "Users delete their chat artifacts" on public.chat_artifacts
    for delete using (user_id = auth.uid() or auth.role() = 'service_role');
