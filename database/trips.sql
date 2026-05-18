create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_name text not null,
  destination_name text not null,
  destination_query text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_valid_dates check (start_date <= end_date),
  constraint trips_max_30_day_span check ((end_date - start_date) <= 30)
);

create index if not exists trips_user_id_idx on public.trips(user_id);
create index if not exists trips_start_date_idx on public.trips(start_date);
create index if not exists trips_created_at_idx on public.trips(created_at desc);

alter table public.trips enable row level security;

grant select, insert, update, delete on public.trips to authenticated;

drop policy if exists "Users can SELECT their own trips" on public.trips;
drop policy if exists "Users can INSERT their own trips" on public.trips;
drop policy if exists "Users can UPDATE their own trips" on public.trips;
drop policy if exists "Users can DELETE their own trips" on public.trips;
drop policy if exists trips_select_own on public.trips;
drop policy if exists trips_insert_own on public.trips;
drop policy if exists trips_update_own on public.trips;
drop policy if exists trips_delete_own on public.trips;

create policy trips_select_own
  on public.trips
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy trips_insert_own
  on public.trips
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy trips_update_own
  on public.trips
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy trips_delete_own
  on public.trips
  for delete
  to authenticated
  using (auth.uid() = user_id);
