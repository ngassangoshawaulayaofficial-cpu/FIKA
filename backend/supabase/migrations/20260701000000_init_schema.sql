-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    phone text,
    email text,
    role text not null check (role in ('customer', 'provider', 'admin')),
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helper security definer function to avoid recursion in RLS policies
create or replace function public.is_admin()
returns boolean as $$
begin
  return coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
end;
$$ language plpgsql security definer;

-- 2. PROVIDER PROFILES TABLE
create table if not exists public.provider_profiles (
    id uuid references public.profiles on delete cascade primary key,
    bio text,
    is_verified boolean default false not null,
    verification_document_url text,
    is_online boolean default false not null,
    rating_avg numeric(3,2) default 5.00 not null check (rating_avg >= 1.00 and rating_avg <= 5.00),
    rating_count integer default 0 not null check (rating_count >= 0),
    is_premium boolean default false not null,
    is_featured boolean default false not null,
    service_radius_km numeric(5,2) default 10.00 not null check (service_radius_km > 0.00),
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SERVICE CATEGORIES TABLE
create table if not exists public.service_categories (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    icon_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PROVIDER SERVICES TABLE
create table if not exists public.provider_services (
    id uuid default gen_random_uuid() primary key,
    provider_id uuid references public.provider_profiles on delete cascade not null,
    category_id uuid references public.service_categories on delete restrict not null,
    name text not null,
    description text,
    price numeric(10,2) not null check (price >= 0.00),
    duration_minutes integer not null check (duration_minutes > 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PROVIDER GALLERY TABLE
create table if not exists public.provider_gallery (
    id uuid default gen_random_uuid() primary key,
    provider_id uuid references public.provider_profiles on delete cascade not null,
    image_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. BOOKINGS TABLE
create table if not exists public.bookings (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.profiles on delete cascade not null,
    provider_id uuid references public.provider_profiles on delete cascade not null,
    status text default 'pending_payment' not null check (status in ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    scheduled_time timestamp with time zone not null,
    address text not null,
    latitude numeric(9,6) not null,
    longitude numeric(9,6) not null,
    total_price numeric(10,2) not null check (total_price >= 0.00),
    commission_fee numeric(10,2) not null check (commission_fee >= 0.00),
    provider_earnings numeric(10,2) not null check (provider_earnings >= 0.00),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. BOOKING SERVICES TABLE
create table if not exists public.booking_services (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings on delete cascade not null,
    service_id uuid references public.provider_services on delete restrict not null,
    price numeric(10,2) not null check (price >= 0.00)
);

-- 8. PAYMENTS TABLE
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings on delete cascade not null,
    snippe_checkout_id text not null unique,
    status text default 'pending' not null check (status in ('pending', 'success', 'failed', 'refunded')),
    amount numeric(10,2) not null check (amount >= 0.00),
    paid_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. REVIEWS TABLE
create table if not exists public.reviews (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings on delete cascade not null unique,
    customer_id uuid references public.profiles on delete cascade not null,
    provider_id uuid references public.provider_profiles on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. NOTIFICATIONS TABLE
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    title text not null,
    message text not null,
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. SAVED ADDRESSES TABLE
create table if not exists public.saved_addresses (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.profiles on delete cascade not null,
    label text not null,
    address text not null,
    latitude numeric(9,6) not null,
    longitude numeric(9,6) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. PROVIDER LOCATIONS TABLE
create table if not exists public.provider_locations (
    provider_id uuid references public.provider_profiles on delete cascade primary key,
    latitude numeric(9,6) not null,
    longitude numeric(9,6) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. SUPPORT TICKETS TABLE
create table if not exists public.support_tickets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles on delete cascade not null,
    subject text not null,
    message text not null,
    status text default 'open' not null check (status in ('open', 'resolved', 'closed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. COMPLAINTS TABLE
create table if not exists public.complaints (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings on delete cascade not null,
    reporter_id uuid references public.profiles on delete cascade not null,
    reason text not null,
    status text default 'pending' not null check (status in ('pending', 'under_review', 'resolved')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. PROMOTIONS TABLE
create table if not exists public.promotions (
    id uuid default gen_random_uuid() primary key,
    provider_id uuid references public.provider_profiles on delete cascade not null,
    banner_url text not null,
    status text default 'active' not null check (status in ('active', 'expired')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. COUPONS TABLE
create table if not exists public.coupons (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    discount_percentage numeric(5,2) not null check (discount_percentage >= 0.00 and discount_percentage <= 100.00),
    max_discount numeric(10,2) check (max_discount >= 0.00),
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. WITHDRAWALS TABLE
create table if not exists public.withdrawals (
    id uuid default gen_random_uuid() primary key,
    provider_id uuid references public.provider_profiles on delete cascade not null,
    amount numeric(10,2) not null check (amount > 0.00),
    status text default 'pending' not null check (status in ('pending', 'completed', 'failed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 18. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    actor_id uuid references public.profiles on delete set null,
    action text not null,
    table_name text not null,
    record_id uuid not null,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- DATABASE INDEXES
-- ==============================================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_provider_profiles_verified on public.provider_profiles(is_verified);
create index if not exists idx_provider_profiles_online on public.provider_profiles(is_online);
create index if not exists idx_provider_services_provider on public.provider_services(provider_id);
create index if not exists idx_provider_services_category on public.provider_services(category_id);
create index if not exists idx_bookings_customer on public.bookings(customer_id);
create index if not exists idx_bookings_provider on public.bookings(provider_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_booking_services_booking on public.booking_services(booking_id);
create index if not exists idx_payments_booking on public.payments(booking_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_reviews_provider on public.reviews(provider_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_saved_addresses_customer on public.saved_addresses(customer_id);
create index if not exists idx_provider_locations_geo on public.provider_locations(latitude, longitude);
create index if not exists idx_withdrawals_provider on public.withdrawals(provider_id);
create index if not exists idx_audit_logs_record on public.audit_logs(table_name, record_id);

-- ==============================================================================
-- TRIGGERS & PROCEDURES
-- ==============================================================================

-- 1. Automate Updated At Fields
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at_column();
create trigger tr_provider_profiles_updated_at before update on public.provider_profiles for each row execute procedure public.update_updated_at_column();
create trigger tr_service_categories_updated_at before update on public.service_categories for each row execute procedure public.update_updated_at_column();
create trigger tr_provider_services_updated_at before update on public.provider_services for each row execute procedure public.update_updated_at_column();
create trigger tr_bookings_updated_at before update on public.bookings for each row execute procedure public.update_updated_at_column();
create trigger tr_payments_updated_at before update on public.payments for each row execute procedure public.update_updated_at_column();
create trigger tr_saved_addresses_updated_at before update on public.saved_addresses for each row execute procedure public.update_updated_at_column();
create trigger tr_provider_locations_updated_at before update on public.provider_locations for each row execute procedure public.update_updated_at_column();
create trigger tr_support_tickets_updated_at before update on public.support_tickets for each row execute procedure public.update_updated_at_column();
create trigger tr_complaints_updated_at before update on public.complaints for each row execute procedure public.update_updated_at_column();
create trigger tr_promotions_updated_at before update on public.promotions for each row execute procedure public.update_updated_at_column();
create trigger tr_withdrawals_updated_at before update on public.withdrawals for each row execute procedure public.update_updated_at_column();

-- 2. Auth Signup Synchronization Trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
    user_role text;
begin
    user_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
    
    insert into public.profiles (id, full_name, email, phone, role, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        new.email,
        coalesce(new.phone, ''),
        user_role,
        coalesce(new.raw_user_meta_data->>'avatar_url', '')
    );

    if user_role = 'provider' then
        insert into public.provider_profiles (id, bio, is_verified, is_online, rating_avg, rating_count, is_premium, is_featured, service_radius_km)
        values (new.id, '', false, false, 5.00, 0, false, false, 10.00);
    end if;

    return new;
end;
$$ language plpgsql security definer;

create or replace trigger tr_on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 3. Review Ratings Average & Count Aggregator Trigger
create or replace function public.calculate_provider_rating()
returns trigger as $$
declare
    p_id uuid;
    avg_r numeric(3,2);
    cnt_r integer;
begin
    if TG_OP = 'DELETE' then
        p_id := old.provider_id;
    else
        p_id := new.provider_id;
    end if;

    select coalesce(avg(rating), 5.00), count(*)
    into avg_r, cnt_r
    from public.reviews
    where provider_id = p_id;

    update public.provider_profiles
    set rating_avg = avg_r,
        rating_count = cnt_r
    where id = p_id;

    return null;
end;
$$ language plpgsql security definer;

create trigger tr_on_review_change
    after insert or update or delete on public.reviews
    for each row execute procedure public.calculate_provider_rating();

-- 4. Audit Log Trigger
create or replace function public.log_audit()
returns trigger as $$
declare
    actor uuid;
    old_val jsonb := null;
    new_val jsonb := null;
    rec_id uuid;
begin
    begin
        actor := auth.uid();
    exception when others then
        actor := null;
    end;

    if TG_OP = 'DELETE' then
        old_val := to_jsonb(old);
        rec_id := old.id;
    elsif TG_OP = 'UPDATE' then
        old_val := to_jsonb(old);
        new_val := to_jsonb(new);
        rec_id := new.id;
    elsif TG_OP = 'INSERT' then
        new_val := to_jsonb(new);
        rec_id := new.id;
    end if;

    insert into public.audit_logs (actor_id, action, table_name, record_id, old_value, new_value)
    values (actor, TG_OP, TG_TABLE_NAME, rec_id, old_val, new_val);

    return null;
end;
$$ language plpgsql security definer;

create trigger tr_audit_bookings after insert or update or delete on public.bookings for each row execute procedure public.log_audit();
create trigger tr_audit_payments after insert or update or delete on public.payments for each row execute procedure public.log_audit();
create trigger tr_audit_withdrawals after insert or update or delete on public.withdrawals for each row execute procedure public.log_audit();
create trigger tr_audit_provider_profiles after insert or update or delete on public.provider_profiles for each row execute procedure public.log_audit();
