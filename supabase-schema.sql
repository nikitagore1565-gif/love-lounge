create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  anonymous_session_id text not null,
  profile_id text not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_profile_created_idx
  on public.chat_messages (anonymous_session_id, profile_id, created_at);

-- Keep this table inaccessible to browser clients. Netlify Functions use the
-- service-role key server-side. Never put that key in index.html.
alter table public.chat_messages enable row level security;


-- One durable memory summary per anonymous session and companion profile.
create table if not exists public.chat_memories (
  id bigint generated always as identity primary key,
  anonymous_session_id text not null,
  profile_id text not null,
  summary text not null default '',
  updated_at timestamptz not null default now(),
  unique (anonymous_session_id, profile_id)
);
create index if not exists chat_memories_session_profile_idx
  on public.chat_memories (anonymous_session_id, profile_id);
alter table public.chat_memories enable row level security;
