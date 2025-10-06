-- Backfill user_settings.user_prefs with new preference switches
-- Adds show_available_tools (default true) and has_seen_collections (default false)
-- Run once in Supabase SQL editor or via psql against the project's database.

UPDATE public.user_settings
SET user_prefs = COALESCE(user_prefs, '{}'::jsonb)
  || jsonb_build_object('show_available_tools', true)
  || jsonb_build_object('has_seen_collections', false)
WHERE (
  user_prefs ->> 'show_available_tools' IS NULL
  OR user_prefs ->> 'has_seen_collections' IS NULL
);
