-- Additional enhancements for chats and artifacts

alter table public.chats
	add column if not exists is_starred boolean not null default false,
	add column if not exists summary text;

alter table public.chat_artifacts
	add column if not exists preview_image_url text,
	add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.chat_attachments (
	id bigserial primary key,
	chat_id uuid not null references public.chats (id) on delete cascade,
    message_id uuid not null references public.chat_messages (id) on delete cascade, -- So we can link attachments to specific messages
	file_name text not null,
	file_type text,
	file_size_bytes bigint,
	storage_path text not null,
	created_at timestamptz not null default timezone('utc', now())
);

alter table public.chat_attachments enable row level security;

create policy if not exists "Users manage their chat attachments" on public.chat_attachments
	for all using (
		exists (
			select 1
			from public.chats c
			where c.id = chat_attachments.chat_id
			  and (c.user_id = auth.uid() or auth.role() = 'service_role')
		)
	)
	with check (
		exists (
			select 1
			from public.chats c
			where c.id = chat_attachments.chat_id
			  and (c.user_id = auth.uid() or auth.role() = 'service_role')
		)
	);

create index if not exists chat_attachments_chat_id_idx on public.chat_attachments (chat_id, created_at desc);
