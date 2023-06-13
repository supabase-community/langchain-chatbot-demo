CREATE TYPE speaker AS ENUM ('user', 'ai');

CREATE TABLE conversations (
  user_id text not null,
  entry text not null,
  speaker speaker not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table conversations
  enable row level security;