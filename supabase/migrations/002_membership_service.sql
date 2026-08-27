do $$ begin
  create type public.membership_source_type as enum ('product', 'promotion', 'restore');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_status as enum ('active', 'expired', 'used_up', 'canceled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_change_type as enum ('issue', 'use', 'expire', 'restore', 'cancel');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.membership_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_count integer not null check (total_count > 0),
  validity_days integer not null check (validity_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  product_id uuid references public.membership_products(id) on delete set null,
  source_type public.membership_source_type not null,
  title text not null,
  total_count integer not null check (total_count >= 0),
  remaining_count integer not null check (remaining_count >= 0),
  start_date date,
  end_date date,
  status public.membership_status not null default 'active',
  restored_from_id uuid references public.memberships(id) on delete set null,
  memo text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_logs (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  change_type public.membership_change_type not null,
  change_amount integer not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists memberships_member_idx on public.memberships (member_id);
create index if not exists memberships_status_idx on public.memberships (status);
create index if not exists memberships_end_date_idx on public.memberships (end_date);

alter table public.membership_products enable row level security;
alter table public.memberships enable row level security;
alter table public.membership_logs enable row level security;

drop policy if exists "admin manages products" on public.membership_products;
create policy "admin manages products"
on public.membership_products
for all
using (public.is_approved_admin())
with check (public.is_approved_admin());

drop policy if exists "member can read own memberships" on public.memberships;
create policy "member can read own memberships"
on public.memberships
for select
using (
  exists (
    select 1 from public.members m
    where m.id = member_id
      and m.auth_user_id = auth.uid()
  )
);

drop policy if exists "admin manages memberships" on public.memberships;
create policy "admin manages memberships"
on public.memberships
for all
using (public.is_approved_admin())
with check (public.is_approved_admin());

drop policy if exists "admin manages membership logs" on public.membership_logs;
create policy "admin manages membership logs"
on public.membership_logs
for all
using (public.is_approved_admin())
with check (public.is_approved_admin());

create or replace function public.consume_membership(
  p_member_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_membership public.memberships;
begin
  select *
  into selected_membership
  from public.memberships
  where member_id = p_member_id
    and status = 'active'
    and remaining_count > 0
    and (end_date is null or end_date >= current_date)
  order by end_date asc nulls last, created_at asc
  for update skip locked
  limit 1;

  if selected_membership.id is null then
    raise exception 'no available membership for member %', p_member_id;
  end if;

  update public.memberships
  set remaining_count = remaining_count - 1,
      status = case when remaining_count - 1 = 0 then 'used_up' else 'active' end,
      updated_at = now()
  where id = selected_membership.id;

  insert into public.membership_logs (
    membership_id,
    change_type,
    change_amount,
    reason,
    created_by
  )
  values (
    selected_membership.id,
    'use',
    1,
    p_reason,
    auth.uid()
  );

  return selected_membership.id;
end;
$$;
