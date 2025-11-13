-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector" with schema extensions;

-- =====================================================
-- USERS (extends Supabase auth.users)
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- SERVERS (Discord-like servers)
-- =====================================================
create table public.servers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  invite_code text unique not null default encode(gen_random_bytes(8), 'hex'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- SERVER MEMBERS (many-to-many relationship)
-- =====================================================
create table public.server_members (
  server_id uuid references public.servers(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (server_id, user_id)
);

-- =====================================================
-- CHANNELS (within servers)
-- =====================================================
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  name text not null,
  agents_md text, -- AGENTS.md configuration for AI personality
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(server_id, name) -- Prevent duplicate channel names in same server
);

-- =====================================================
-- MESSAGES
-- =====================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_ai boolean default false not null,
  embedding vector(768), -- Gemini text-embedding-004 produces 768 dimensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Fast lookups for channel messages
create index messages_channel_id_created_at_idx on public.messages(channel_id, created_at desc);

-- Fast vector similarity search using HNSW (cosine distance)
create index messages_embedding_idx on public.messages 
  using hnsw (embedding vector_cosine_ops);

-- Fast user lookups
create index profiles_username_idx on public.profiles(username);

-- Fast server member lookups
create index server_members_user_id_idx on public.server_members(user_id);

-- Fast channel lookups by server
create index channels_server_id_idx on public.channels(server_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.servers enable row level security;
alter table public.server_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;

-- Profiles: Users can read all profiles, but only update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Servers: Users can read servers they're members of
create policy "Users can view servers they are members of"
  on public.servers for select
  using (
    exists (
      select 1 from public.server_members
      where server_members.server_id = servers.id
        and server_members.user_id = auth.uid()
    )
  );

create policy "Users can create servers"
  on public.servers for insert
  with check (auth.uid() = owner_id);

create policy "Server owners can update their servers"
  on public.servers for update
  using (auth.uid() = owner_id);

create policy "Server owners can delete their servers"
  on public.servers for delete
  using (auth.uid() = owner_id);

-- Server Members: Users can view members of servers they belong to
create policy "Users can view members of their servers"
  on public.server_members for select
  using (
    exists (
      select 1 from public.server_members sm
      where sm.server_id = server_members.server_id
        and sm.user_id = auth.uid()
    )
  );

create policy "Users can join servers with invite"
  on public.server_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave servers"
  on public.server_members for delete
  using (auth.uid() = user_id);

-- Channels: Users can read channels in servers they're members of
create policy "Users can view channels in their servers"
  on public.channels for select
  using (
    exists (
      select 1 from public.server_members
      where server_members.server_id = channels.server_id
        and server_members.user_id = auth.uid()
    )
  );

create policy "Server owners can create channels"
  on public.channels for insert
  with check (
    exists (
      select 1 from public.servers
      where servers.id = channels.server_id
        and servers.owner_id = auth.uid()
    )
  );

create policy "Server owners can update channels"
  on public.channels for update
  using (
    exists (
      select 1 from public.servers
      where servers.id = channels.server_id
        and servers.owner_id = auth.uid()
    )
  );

create policy "Server owners can delete channels"
  on public.channels for delete
  using (
    exists (
      select 1 from public.servers
      where servers.id = channels.server_id
        and servers.owner_id = auth.uid()
    )
  );

-- Messages: Users can read messages in channels they have access to
create policy "Users can view messages in their channels"
  on public.messages for select
  using (
    exists (
      select 1 from public.channels
      join public.server_members on server_members.server_id = channels.server_id
      where channels.id = messages.channel_id
        and server_members.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their channels"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.channels
      join public.server_members on server_members.server_id = channels.server_id
      where channels.id = messages.channel_id
        and server_members.user_id = auth.uid()
    )
  );

create policy "Users can update own messages"
  on public.messages for update
  using (auth.uid() = user_id);

create policy "Users can delete own messages"
  on public.messages for delete
  using (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to auto-add server owner as member
create or replace function public.handle_new_server()
returns trigger as $$
begin
  insert into public.server_members (server_id, user_id)
  values (new.id, new.owner_id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-add owner as member
create trigger on_server_created
  after insert on public.servers
  for each row execute procedure public.handle_new_server();

-- Function for semantic search (vector similarity)
create or replace function match_messages (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  channel_filter uuid default null
)
returns table (
  id uuid,
  channel_id uuid,
  user_id uuid,
  content text,
  is_ai boolean,
  created_at timestamp with time zone,
  similarity float
)
language sql
as $$
  select
    messages.id,
    messages.channel_id,
    messages.user_id,
    messages.content,
    messages.is_ai,
    messages.created_at,
    1 - (messages.embedding <=> query_embedding) as similarity
  from public.messages
  where 
    messages.embedding is not null
    and 1 - (messages.embedding <=> query_embedding) > match_threshold
    and (channel_filter is null or messages.channel_id = channel_filter)
  order by messages.embedding <=> query_embedding asc
  limit least(match_count, 200);
$$;

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.servers
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.channels
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.messages
  for each row execute procedure public.handle_updated_at();

-- =====================================================
-- REALTIME PUBLICATION (for Postgres Changes - optional)
-- =====================================================
-- Note: We're primarily using Broadcast, but enabling this for flexibility
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.server_members;
