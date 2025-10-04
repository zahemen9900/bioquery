-- Track user feedback on individual chat messages

alter table public.chat_messages
    add column if not exists feedback text check (feedback in ('like', 'dislike')),
    add column if not exists feedback_user_id uuid references public.users (id) on delete set null,
    add column if not exists feedback_updated_at timestamptz;

create index if not exists chat_messages_feedback_idx on public.chat_messages (chat_id, feedback);
