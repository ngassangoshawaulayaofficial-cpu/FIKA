-- 1. Create notifications table
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text not null, -- e.g. 'booking', 'payment', 'system', 'security'
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create notification_preferences table
create table if not exists public.notification_preferences (
    user_id uuid primary key references public.profiles(id) on delete cascade not null,
    enable_push boolean default true not null,
    enable_email boolean default true not null,
    enable_sms boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- 4. Create RLS Policies
create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

create policy "Users can view their own preferences"
    on public.notification_preferences for select
    using (auth.uid() = user_id);

create policy "Users can update their own preferences"
    on public.notification_preferences for update
    using (auth.uid() = user_id);

-- Admin Bypass Policies
create policy "Admins can manage all notifications"
    on public.notifications for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- 5. Trigger to automatically instantiate preferences when profile is created
create or replace function public.handle_new_user_preferences()
returns trigger as $$
begin
    insert into public.notification_preferences (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_preferences
    after insert on public.profiles
    for each row execute procedure public.handle_new_user_preferences();
