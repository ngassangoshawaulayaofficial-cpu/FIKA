-- Enable PostGIS extension for geolocation queries
create extension if not exists postgis;

-- 1. Create a spatial geography index on provider locations to speed up geosearch queries
create index if not exists idx_provider_locations_geom 
    on public.provider_locations 
    using gist (st_geographyfromtext('SRID=4326;POINT(' || longitude || ' ' || latitude || ')'));

-- 2. Create the search_providers PostgreSQL function
create or replace function public.search_providers(
    search_lat numeric,
    search_lng numeric,
    category_id_filter uuid default null,
    max_distance_km numeric default 50.0
)
returns table (
    id uuid,
    full_name text,
    avatar_url text,
    bio text,
    rating_avg numeric,
    rating_count integer,
    distance_km numeric,
    is_online boolean,
    is_premium boolean,
    is_featured boolean
) as $$
begin
    return query
    select 
        p.id,
        p.full_name,
        p.avatar_url,
        pp.bio,
        pp.rating_avg,
        pp.rating_count,
        (st_distance(
            st_geographyfromtext('SRID=4326;POINT(' || pl.longitude || ' ' || pl.latitude || ')'),
            st_geographyfromtext('SRID=4326;POINT(' || search_lng || ' ' || search_lat || ')')
        ) / 1000.0)::numeric as distance_km,
        pp.is_online,
        pp.is_premium,
        pp.is_featured
    from public.provider_profiles pp
    join public.profiles p on p.id = pp.id
    join public.provider_locations pl on pl.provider_id = pp.id
    where pp.is_verified = true
      and pp.is_online = true
      -- Distance check
      and st_dwithin(
          st_geographyfromtext('SRID=4326;POINT(' || pl.longitude || ' ' || pl.latitude || ')'),
          st_geographyfromtext('SRID=4326;POINT(' || search_lng || ' ' || search_lat || ')'),
          max_distance_km * 1000.0
      )
      -- Service Category Filter (if specified)
      and (
          category_id_filter is null or exists (
              select 1 from public.provider_services ps 
              where ps.provider_id = pp.id and ps.category_id = category_id_filter
          )
      )
    order by pp.is_featured desc, pp.is_premium desc, distance_km asc;
end;
$$ language plpgsql security definer;
