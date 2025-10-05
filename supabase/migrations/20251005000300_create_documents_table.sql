set check_function_bodies = off;

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    chat_id uuid references public.chats (id) on delete cascade,
    document_type text not null default 'document' check (document_type in ('document', 'translation', 'other')),
    title text not null,
    body text not null,
    image_prompt text,
    image_link text,
    tags text[] not null default '{}',
    metadata jsonb not null default jsonb_build_object(),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_user_idx on public.documents (user_id, created_at desc);
create index if not exists documents_chat_idx on public.documents (chat_id, created_at desc);

alter table public.documents enable row level security;

create policy "Users manage their documents" on public.documents
    for all
    using (
        auth.role() = 'service_role'
        or auth.uid() = user_id
        or exists (
            select 1 from public.chats c
            where c.id = documents.chat_id
              and c.user_id = auth.uid()
        )
    )
    with check (
        auth.role() = 'service_role'
        or auth.uid() = user_id
        or exists (
            select 1 from public.chats c
            where c.id = documents.chat_id
              and c.user_id = auth.uid()
        )
    );
