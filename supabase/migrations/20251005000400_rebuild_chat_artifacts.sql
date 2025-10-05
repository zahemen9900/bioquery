set check_function_bodies = off;

drop table if exists public.chat_artifacts cascade;

create table public.chat_artifacts (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid not null references public.chats (id) on delete cascade,
    message_id bigint references public.chat_messages (id) on delete set null,
    artifact_type text not null,
    content jsonb not null default jsonb_build_object(),
    tags text[] not null default '{}',
    title text,
    summary text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index chat_artifacts_chat_idx on public.chat_artifacts (chat_id, created_at desc);
create index chat_artifacts_message_idx on public.chat_artifacts (message_id);
create index chat_artifacts_type_idx on public.chat_artifacts (artifact_type);

alter table public.chat_artifacts enable row level security;

create policy "Users manage their chat artifacts" on public.chat_artifacts
    for all
    using (
        auth.role() = 'service_role'
        or exists (
            select 1
            from public.chats c
            where c.id = chat_artifacts.chat_id
              and (c.user_id = auth.uid() or auth.role() = 'service_role')
        )
    )
    with check (
        auth.role() = 'service_role'
        or exists (
            select 1
            from public.chats c
            where c.id = chat_artifacts.chat_id
              and (c.user_id = auth.uid() or auth.role() = 'service_role')
        )
    );
