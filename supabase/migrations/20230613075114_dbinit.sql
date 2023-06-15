CREATE TYPE speaker AS ENUM ('user', 'ai');

CREATE TABLE conversations (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  entry text,
  speaker speaker not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint conversations_pkey primary key (id)
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table conversations
  enable row level security;