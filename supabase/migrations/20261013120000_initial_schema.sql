-- Lactae — schéma initial Supabase
-- Tables : profiles, tirages, journal_entries
-- + RLS, trigger signup, updated_at

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 avec auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text
    check (
      display_name is null
      or char_length(trim(display_name)) between 1 and 80
    ),
  target_ml_24h integer not null default 800
    check (target_ml_24h > 0),
  timezone text not null default 'Europe/Paris',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- tirages
-- ---------------------------------------------------------------------------

create table public.tirages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  datetime timestamptz not null,
  quantity_ml integer not null
    check (quantity_ml > 0 and quantity_ml % 10 = 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tirages_user_id_datetime_idx
  on public.tirages (user_id, datetime desc);

create trigger tirages_set_updated_at
  before update on public.tirages
  for each row
  execute function public.set_updated_at();

alter table public.tirages enable row level security;

create policy "tirages_select_own"
  on public.tirages
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "tirages_insert_own"
  on public.tirages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "tirages_update_own"
  on public.tirages
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tirages_delete_own"
  on public.tirages
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- journal_entries
-- ---------------------------------------------------------------------------

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  datetime timestamptz not null,
  text text not null
    check (char_length(trim(text)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journal_entries_user_id_datetime_idx
  on public.journal_entries (user_id, datetime desc);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row
  execute function public.set_updated_at();

alter table public.journal_entries enable row level security;

create policy "journal_entries_select_own"
  on public.journal_entries
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "journal_entries_insert_own"
  on public.journal_entries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "journal_entries_update_own"
  on public.journal_entries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "journal_entries_delete_own"
  on public.journal_entries
  for delete
  to authenticated
  using (auth.uid() = user_id);
