-- Migration: create documents table for tool-generated content
set check_function_bodies = off;

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references public.chats (id) on delete set null,
    message_id bigint references public.chat_messages (id) on delete set null,
    user_id uuid not null references public.users (id) on delete cascade,
    tool_call_id text,
    tool_name text not null,
    document_kind text not null check (document_kind in ('document', 'translated_publication', 'other')),
    title text not null,
    body text not null,
    tags text[] not null default '{}',
    source_uri text,
    metadata jsonb not null default '{}',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_user_chat_idx
    on public.documents (user_id, chat_id, created_at desc);

create index if not exists documents_tags_gin_idx
    on public.documents using gin (tags);

alter table public.documents enable row level security;

create policy "Users view their documents" on public.documents
    for select using (user_id = auth.uid() or auth.role() = 'service_role');

create policy "Users insert their documents" on public.documents
    for insert with check (user_id = auth.uid() or auth.role() = 'service_role');

create policy "Users update their documents" on public.documents
    for update using (user_id = auth.uid() or auth.role() = 'service_role')
    with check (user_id = auth.uid() or auth.role() = 'service_role');

create policy "Users delete their documents" on public.documents
    for delete using (user_id = auth.uid() or auth.role() = 'service_role');
