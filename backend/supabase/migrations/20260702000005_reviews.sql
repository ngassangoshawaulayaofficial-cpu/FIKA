-- 1. Create reviews table
create table if not exists public.reviews (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid references public.bookings(id) on delete cascade not null,
    customer_id uuid references public.profiles(id) on delete cascade not null,
    provider_id uuid references public.profiles(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    provider_reply text,
    helpful_count integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Prevent duplicate reviews for the same booking
    unique(booking_id)
);

-- 2. Create review_images table
create table if not exists public.review_images (
    id uuid primary key default gen_random_uuid(),
    review_id uuid references public.reviews(id) on delete cascade not null,
    image_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create review_reports table
create table if not exists public.review_reports (
    id uuid primary key default gen_random_uuid(),
    review_id uuid references public.reviews(id) on delete cascade not null,
    reporter_id uuid references public.profiles(id) on delete cascade not null,
    reason text not null,
    status text default 'pending' not null, -- 'pending', 'resolved', 'dismissed'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table public.reviews enable row level security;
alter table public.review_images enable row level security;
alter table public.review_reports enable row level security;

-- 5. RLS Policies

-- Reviews: Select is public
create policy "Reviews are publicly visible"
    on public.reviews for select
    using (true);

create policy "Customers can insert reviews for their completed bookings"
    on public.reviews for insert
    with check (
        auth.uid() = customer_id and
        exists (
            select 1 from public.bookings b
            where b.id = booking_id
            and b.customer_id = auth.uid()
            and b.status = 'completed'
        )
    );

create policy "Customers can update their reviews within 24 hours"
    on public.reviews for update
    using (
        auth.uid() = customer_id and
        created_at >= (now() - interval '24 hours')
    );

create policy "Customers can delete their reviews within 24 hours"
    on public.reviews for delete
    using (
        auth.uid() = customer_id and
        created_at >= (now() - interval '24 hours')
    );

-- Images: Select public
create policy "Review images are publicly visible"
    on public.review_images for select
    using (true);

create policy "Customers can add images to their reviews"
    on public.review_images for insert
    with check (
        exists (
            select 1 from public.reviews r
            where r.id = review_id
            and r.customer_id = auth.uid()
        )
    );

-- Reports
create policy "Authorized users can report reviews"
    on public.review_reports for insert
    with check (auth.uid() = reporter_id);

-- Admin Bypass
create policy "Admins can manage all reviews and reports"
    on public.reviews for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- 6. Trigger to automatically recalculate provider ratings on review changes
create or replace function public.recalculate_provider_rating()
returns trigger as $$
declare
    avg_rating numeric;
    cnt_rating integer;
    target_provider_id uuid;
begin
    if (TG_OP = 'DELETE') then
        target_provider_id := old.provider_id;
    else
        target_provider_id := new.provider_id;
    end if;

    select coalesce(avg(rating), 0.0), count(id)
    into avg_rating, cnt_rating
    from public.reviews
    where provider_id = target_provider_id;

    update public.provider_profiles
    set rating_avg = avg_rating,
        rating_count = cnt_rating
    where id = target_provider_id;

    return null;
end;
$$ language plpgsql security definer;

create trigger on_review_changed
    after insert or update or delete on public.reviews
    for each row execute procedure public.recalculate_provider_rating();
