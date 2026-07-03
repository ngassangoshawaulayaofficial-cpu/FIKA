-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.provider_services enable row level security;
alter table public.provider_gallery enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_services enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.provider_locations enable row level security;
alter table public.support_tickets enable row level security;
alter table public.complaints enable row level security;
alter table public.promotions enable row level security;
alter table public.coupons enable row level security;
alter table public.withdrawals enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES Policies
create policy "Allow profile selection" on public.profiles
    for select using (auth.uid() = id or public.is_admin() or role = 'provider');

create policy "Allow profile updates" on public.profiles
    for update using (auth.uid() = id or public.is_admin());

-- PROVIDER PROFILES Policies
create policy "Allow provider profiles select" on public.provider_profiles
    for select using (is_verified = true or auth.uid() = id or public.is_admin());

create policy "Allow provider updates self" on public.provider_profiles
    for update using (
        (auth.uid() = id and is_verified = (select is_verified from public.provider_profiles where id = auth.uid()))
        or public.is_admin()
    );

-- SERVICE CATEGORIES Policies
create policy "Allow categories read" on public.service_categories
    for select using (true);

create policy "Allow categories mod admin" on public.service_categories
    for all using (public.is_admin());

-- PROVIDER SERVICES Policies
create policy "Allow services read" on public.provider_services
    for select using (true);

create policy "Allow services management" on public.provider_services
    for all using (auth.uid() = provider_id or public.is_admin());

-- PROVIDER GALLERY Policies
create policy "Allow gallery read" on public.provider_gallery
    for select using (true);

create policy "Allow gallery write" on public.provider_gallery
    for all using (auth.uid() = provider_id or public.is_admin());

-- BOOKINGS Policies
create policy "Allow bookings read" on public.bookings
    for select using (auth.uid() = customer_id or auth.uid() = provider_id or public.is_admin());

create policy "Allow customer create bookings" on public.bookings
    for insert with check (auth.uid() = customer_id);

create policy "Allow booking update" on public.bookings
    for update using (auth.uid() = customer_id or auth.uid() = provider_id or public.is_admin());

-- BOOKING SERVICES Policies
create policy "Allow booking services read" on public.booking_services
    for select using (
        exists (select 1 from public.bookings b where b.id = booking_id and (b.customer_id = auth.uid() or b.provider_id = auth.uid()))
        or public.is_admin()
    );

create policy "Allow booking services insert" on public.booking_services
    for insert with check (
        exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
    );

-- PAYMENTS Policies
create policy "Allow payments read" on public.payments
    for select using (
        exists (select 1 from public.bookings b where b.id = booking_id and (b.customer_id = auth.uid() or b.provider_id = auth.uid()))
        or public.is_admin()
    );

create policy "Allow payments admin only" on public.payments
    for all using (public.is_admin());

-- REVIEWS Policies
create policy "Allow reviews read" on public.reviews
    for select using (true);

create policy "Allow reviews write" on public.reviews
    for insert with check (auth.uid() = customer_id);

create policy "Allow reviews update" on public.reviews
    for update using (auth.uid() = customer_id or public.is_admin());

-- NOTIFICATIONS Policies
create policy "Allow notifications read" on public.notifications
    for select using (auth.uid() = user_id or public.is_admin());

create policy "Allow notifications update" on public.notifications
    for update using (auth.uid() = user_id or public.is_admin());

-- SAVED ADDRESSES Policies
create policy "Allow addresses access" on public.saved_addresses
    for all using (auth.uid() = customer_id or public.is_admin());

-- PROVIDER LOCATIONS Policies
create policy "Allow locations read" on public.provider_locations
    for select using (true);

create policy "Allow locations update" on public.provider_locations
    for all using (auth.uid() = provider_id or public.is_admin());

-- SUPPORT TICKETS Policies
create policy "Allow support tickets read" on public.support_tickets
    for select using (auth.uid() = user_id or public.is_admin());

create policy "Allow support tickets insert" on public.support_tickets
    for insert with check (auth.uid() = user_id);

create policy "Allow support tickets update" on public.support_tickets
    for update using (public.is_admin());

-- COMPLAINTS Policies
create policy "Allow complaints read" on public.complaints
    for select using (
        auth.uid() = reporter_id 
        or exists (select 1 from public.bookings b where b.id = booking_id and b.provider_id = auth.uid()) 
        or public.is_admin()
    );

create policy "Allow complaints insert" on public.complaints
    for insert with check (auth.uid() = reporter_id);

create policy "Allow complaints update" on public.complaints
    for update using (public.is_admin());

-- PROMOTIONS Policies
create policy "Allow active promotions read" on public.promotions
    for select using (status = 'active');

create policy "Allow promotions write" on public.promotions
    for all using (auth.uid() = provider_id or public.is_admin());

-- COUPONS Policies
create policy "Allow coupons read" on public.coupons
    for select using (true);

create policy "Allow coupons modification" on public.coupons
    for all using (public.is_admin());

-- WITHDRAWALS Policies
create policy "Allow withdrawals read" on public.withdrawals
    for select using (auth.uid() = provider_id or public.is_admin());

create policy "Allow withdrawals insert" on public.withdrawals
    for insert with check (auth.uid() = provider_id);

create policy "Allow withdrawals update" on public.withdrawals
    for update using (public.is_admin());

-- AUDIT LOGS Policies
create policy "Allow audit logs view admin only" on public.audit_logs
    for select using (public.is_admin());
