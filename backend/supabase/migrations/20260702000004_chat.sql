-- 1. Create conversations table
create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid references public.bookings(id) on delete set null,
    status text default 'active' not null, -- 'active', 'reported', 'blocked'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create conversation participants
create table if not exists public.conversation_participants (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(conversation_id, user_id)
);

-- 3. Create messages table
create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete set null not null,
    text text,
    latitude numeric,
    longitude numeric,
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create message_attachments table
create table if not exists public.message_attachments (
    id uuid primary key default gen_random_uuid(),
    message_id uuid references public.messages(id) on delete cascade not null,
    url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;

-- 6. Create RLS Policies

-- Participants
create policy "Users can select their participant rows"
    on public.conversation_participants for select
    using (auth.uid() = user_id);

create policy "Users can insert participant rows"
    on public.conversation_participants for insert
    with check (auth.uid() = user_id);

-- Conversations
create policy "Users can view their conversations"
    on public.conversations for select
    using (
        exists (
            select 1 from public.conversation_participants
            where conversation_participants.conversation_id = conversations.id
            and conversation_participants.user_id = auth.uid()
        )
    );

create policy "Users can update their conversations"
    on public.conversations for update
    using (
        exists (
            select 1 from public.conversation_participants
            where conversation_participants.conversation_id = conversations.id
            and conversation_participants.user_id = auth.uid()
        )
    );

create policy "Users can insert conversations"
    on public.conversations for insert
    with check (true);

-- Messages
create policy "Users can view messages in their conversations"
    on public.messages for select
    using (
        exists (
            select 1 from public.conversation_participants
            where conversation_participants.conversation_id = messages.conversation_id
            and conversation_participants.user_id = auth.uid()
        )
    );

create policy "Users can insert messages in their conversations"
    on public.messages for insert
    with check (
        auth.uid() = sender_id and
        exists (
            select 1 from public.conversation_participants
            where conversation_participants.conversation_id = messages.conversation_id
            and conversation_participants.user_id = auth.uid()
        )
    );

-- Attachments
create policy "Users can view attachments in their conversations"
    on public.message_attachments for select
    using (
        exists (
            select 1 from public.messages m
            join public.conversation_participants cp on cp.conversation_id = m.conversation_id
            where m.id = message_attachments.message_id
            and cp.user_id = auth.uid()
        )
    );

create policy "Users can insert attachments in their conversations"
    on public.message_attachments for insert
    with check (
        exists (
            select 1 from public.messages m
            join public.conversation_participants cp on cp.conversation_id = m.conversation_id
            where m.id = message_attachments.message_id
            and cp.user_id = auth.uid()
            and m.sender_id = auth.uid()
        )
    );

-- Admin Bypass
create policy "Admins can view and manage all chat logs"
    on public.conversations for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );
