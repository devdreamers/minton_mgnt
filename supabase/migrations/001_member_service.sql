create extension if not exists "pgcrypto";

do $$ begin
  create type public.member_role as enum ('member', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.member_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.auth_provider as enum ('google', 'kakao');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  provider public.auth_provider,
  role public.member_role not null default 'member',
  status public.member_status not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists members_status_idx on public.members (status);
create index if not exists members_email_idx on public.members (email);

create or replace function public.is_approved_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.auth_user_id = auth.uid()
      and m.role = 'admin'
      and m.status = 'approved'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  provider_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, 'member'), '@', 1)
  );
  provider_name := lower(coalesce(
    new.raw_app_meta_data ->> 'provider',
    new.raw_user_meta_data ->> 'provider',
    'google'
  ));

  insert into public.members (
    auth_user_id,
    name,
    phone,
    email,
    provider,
    role,
    status
  )
  values (
    new.id,
    display_name,
    new.raw_user_meta_data ->> 'phone',
    new.email,
    case
      when provider_name = 'kakao' then 'kakao'::public.auth_provider
      else 'google'::public.auth_provider
    end,
    'member',
    'pending'
  )
  on conflict (auth_user_id) do update
    set name = excluded.name,
        phone = excluded.phone,
        email = excluded.email,
        provider = excluded.provider;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.approve_member(p_member_id uuid)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_member public.members;
begin
  update public.members
  set status = 'approved',
      approved_at = now(),
      approved_by = auth.uid()
  where id = p_member_id
  returning * into updated_member;

  if updated_member.id is null then
    raise exception 'member not found';
  end if;

  return updated_member;
end;
$$;

create or replace function public.reject_member(p_member_id uuid)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_member public.members;
begin
  update public.members
  set status = 'rejected'
  where id = p_member_id
  returning * into updated_member;

  if updated_member.id is null then
    raise exception 'member not found';
  end if;

  return updated_member;
end;
$$;

alter table public.members enable row level security;

drop policy if exists "members can read own row" on public.members;
create policy "members can read own row"
on public.members
for select
using (auth.uid() = auth_user_id);

drop policy if exists "admins can manage members" on public.members;
create policy "admins can manage members"
on public.members
for all
using (public.is_approved_admin())
with check (public.is_approved_admin());
