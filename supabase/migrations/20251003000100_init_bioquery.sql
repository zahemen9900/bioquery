-- BioQuery initial schema + auth bridge
-- Run this migration in Supabase to provision application tables and hooks

set check_function_bodies = off;

create extension if not exists "pgcrypto";

-- Core tables -------------------------------------------------------------
create table public.users (
    id uuid primary key references auth.users (id) on delete cascade,
    email text unique not null,
    full_name text,
    nickname text,
    avatar_url text,
    last_login_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index users_email_idx on public.users (email);

create table public.user_settings (
    user_id uuid primary key references public.users (id) on delete cascade,
    preferred_theme text check (preferred_theme in ('light', 'dark')) default 'light',
    user_prefs jsonb not null default jsonb_build_object(
        'show_onboarding', true,
        'auto_summarize', true
    ),
    updated_at timestamptz not null default timezone('utc', now())
);

create table public.chats (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    chat_name text,
    date_last_modified timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now())
);

create index chats_user_idx on public.chats (user_id, date_last_modified desc);

create table public.chat_messages (
    id bigserial primary key,
    chat_id uuid not null references public.chats (id) on delete cascade,
    sender text not null check (sender in ('user', 'assistant', 'system')),
    content text not null,
    tool_calls jsonb not null default '[]'::jsonb,
    tool_contents jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index chat_messages_chat_id_idx on public.chat_messages (chat_id, created_at desc);

create table public.chat_artifacts (
    id bigserial primary key,
    chat_id uuid not null references public.chats (id) on delete cascade,
    artifact_type text not null check (artifact_type in ('summary', 'document', 'visualization', 'dataset')),
    title text,
    content text,
    created_at timestamptz not null default timezone('utc', now())
);

create index chat_artifacts_chat_id_idx on public.chat_artifacts (chat_id, created_at desc);

-- Row level security ------------------------------------------------------
alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_artifacts enable row level security;

create policy "Users can view own profile" on public.users
    for select using (auth.uid() = id or auth.role() = 'service_role');

create policy "Users can update own profile" on public.users
    for update using (auth.uid() = id or auth.role() = 'service_role')
    with check (auth.uid() = id or auth.role() = 'service_role');

create policy "Users manage their settings" on public.user_settings
    for all using (auth.uid() = user_id or auth.role() = 'service_role')
    with check (auth.uid() = user_id or auth.role() = 'service_role');

create policy "Users manage their chats" on public.chats
    for all using (auth.uid() = user_id or auth.role() = 'service_role')
    with check (auth.uid() = user_id or auth.role() = 'service_role');

create policy "Users manage their chat messages" on public.chat_messages
    for all using (
        exists (
            select 1
            from public.chats c
            where c.id = chat_messages.chat_id
              and (c.user_id = auth.uid() or auth.role() = 'service_role')
        )
    )
    with check (
        exists (
            select 1
            from public.chats c
            where c.id = chat_messages.chat_id
              and (c.user_id = auth.uid() or auth.role() = 'service_role')
        )
    );

create policy "Users manage their chat artifacts" on public.chat_artifacts
    for all using (
        exists (
            select 1
            from public.chats c
            where c.id = chat_artifacts.chat_id
              and (c.user_id = auth.uid() or auth.role() = 'service_role')
        )
    )
    with check (
        exists (
            select 1
            from public.chats c
            where c.id = chat_artifacts.chat_id
              and (c.user_id = auth.uid() or auth.role() = 'service_role')
        )
    );

-- Provisioning bridge -----------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_full_name text;
    v_nickname text;
begin
    -- Extract full name from metadata or use email
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email);
    
    -- Set nickname to first name (first word of full_name) or custom nickname from metadata
    v_nickname := coalesce(
        new.raw_user_meta_data->>'nickname',
        split_part(v_full_name, ' ', 1)
    );
    
    insert into public.users (id, email, full_name, nickname, avatar_url, last_login_at, created_at, updated_at)
    values (
        new.id,
        new.email,
        v_full_name,
        v_nickname,
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        timezone('utc', now()),
        timezone('utc', now()),
        timezone('utc', now())
    )
    on conflict (id) do update set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        nickname = coalesce(excluded.nickname, public.users.nickname),
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
        last_login_at = timezone('utc', now()),
        updated_at = timezone('utc', now());

    insert into public.user_settings (user_id, preferred_theme, user_prefs, updated_at)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'preferred_theme', 'light'),
        jsonb_build_object('show_onboarding', true, 'auto_summarize', true, 'show_available_tools', true, 'has_seen_collections', false),
        timezone('utc', now())
    )
    on conflict (user_id) do nothing;

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
