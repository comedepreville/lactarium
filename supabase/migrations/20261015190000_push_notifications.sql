-- Lactae — notifications push (abonnements + file d’attente)

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

create index push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row
  execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- scheduled_notifications
-- ---------------------------------------------------------------------------

create table public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  kind text not null
    check (kind in ('reminder_10min', 'timer_done')),
  dedupe_key text not null,
  fire_at timestamptz not null,
  title text not null
    check (char_length(trim(title)) between 1 and 120),
  body text not null
    check (char_length(trim(body)) between 1 and 500),
  url text not null default '/'
    check (char_length(trim(url)) between 1 and 500),
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scheduled_notifications_due_idx
  on public.scheduled_notifications (fire_at)
  where status = 'pending';

create index scheduled_notifications_user_id_idx
  on public.scheduled_notifications (user_id);

-- Une seule notif pending par (user, dedupe_key)
create unique index scheduled_notifications_pending_dedupe_idx
  on public.scheduled_notifications (user_id, dedupe_key)
  where status = 'pending';

create trigger scheduled_notifications_set_updated_at
  before update on public.scheduled_notifications
  for each row
  execute function public.set_updated_at();

alter table public.scheduled_notifications enable row level security;

create policy "scheduled_notifications_select_own"
  on public.scheduled_notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "scheduled_notifications_insert_own"
  on public.scheduled_notifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "scheduled_notifications_update_own"
  on public.scheduled_notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scheduled_notifications_delete_own"
  on public.scheduled_notifications
  for delete
  to authenticated
  using (auth.uid() = user_id);
