create table if not exists public.diverxo_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.diverxo_reservations (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  folio text not null unique,
  status text not null check (status in ('pendiente', 'confirmada', 'cancelada')),
  space_id text not null,
  event_date date not null,
  start_time text not null,
  end_time text not null,
  guests integer not null check (guests > 0),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.diverxo_quotes (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.diverxo_profiles enable row level security;
alter table public.diverxo_reservations enable row level security;
alter table public.diverxo_quotes enable row level security;

drop policy if exists "perfil propio" on public.diverxo_profiles;
create policy "perfil propio" on public.diverxo_profiles
  for select using (auth.uid() = id);
drop policy if exists "perfil propio actualizar" on public.diverxo_profiles;
create policy "perfil propio actualizar" on public.diverxo_profiles
  for update using (auth.uid() = id);
drop policy if exists "perfil propio crear" on public.diverxo_profiles;
create policy "perfil propio crear" on public.diverxo_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "ver mis reservaciones" on public.diverxo_reservations;
create policy "ver mis reservaciones" on public.diverxo_reservations
  for select using (auth.uid() = user_id);
drop policy if exists "crear mi reservacion" on public.diverxo_reservations;
create policy "crear mi reservacion" on public.diverxo_reservations
  for insert with check (auth.uid() = user_id);
drop policy if exists "cancelar mi reservacion" on public.diverxo_reservations;
create policy "cancelar mi reservacion" on public.diverxo_reservations
  for update using (auth.uid() = user_id);

drop policy if exists "ver mis cotizaciones" on public.diverxo_quotes;
create policy "ver mis cotizaciones" on public.diverxo_quotes
  for select using (auth.uid() = user_id);
drop policy if exists "crear mi cotizacion" on public.diverxo_quotes;
create policy "crear mi cotizacion" on public.diverxo_quotes
  for insert with check (auth.uid() = user_id);

create or replace function public.diverxo_list_busy_slots()
returns table (
  id text,
  space_id text,
  event_date date,
  start_time text,
  end_time text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select id, space_id, event_date, start_time, end_time, status
  from public.diverxo_reservations
  where status <> 'cancelada';
$$;

grant execute on function public.diverxo_list_busy_slots() to anon, authenticated;

create or replace function public.diverxo_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.diverxo_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists diverxo_on_auth_user_created on auth.users;
create trigger diverxo_on_auth_user_created
  after insert on auth.users
  for each row execute function public.diverxo_handle_new_user();
