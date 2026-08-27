do $$ begin
  create type public.session_status as enum ('scheduled', 'canceled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.session_application_status as enum ('confirmed', 'waitlisted', 'canceled');
exception when duplicate_object then null;
end $$;

create table if not exists public.session_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  capacity integer not null check (capacity > 0),
  application_open_time time not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.session_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.session_templates(id) on delete restrict,
  session_date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  application_open_at timestamptz not null,
  status public.session_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  unique (template_id, session_date)
);

create table if not exists public.session_applications (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.session_instances(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status public.session_application_status not null default 'confirmed',
  waitlist_position integer,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists session_applications_active_member_idx
  on public.session_applications (session_id, member_id)
  where status in ('confirmed', 'waitlisted');
create index if not exists session_instances_date_idx on public.session_instances (session_date, start_at);
create index if not exists session_applications_session_idx on public.session_applications (session_id, status, waitlist_position);

alter table public.session_templates enable row level security;
alter table public.session_instances enable row level security;
alter table public.session_applications enable row level security;

drop policy if exists "members can read active session templates" on public.session_templates;
create policy "members can read active session templates" on public.session_templates
for select using (is_active or public.is_approved_admin());
drop policy if exists "admins manage session templates" on public.session_templates;
create policy "admins manage session templates" on public.session_templates
for all using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "members can read scheduled sessions" on public.session_instances;
create policy "members can read scheduled sessions" on public.session_instances
for select using (status = 'scheduled' or public.is_approved_admin());
drop policy if exists "admins manage sessions" on public.session_instances;
create policy "admins manage sessions" on public.session_instances
for all using (public.is_approved_admin()) with check (public.is_approved_admin());

drop policy if exists "members can read own applications" on public.session_applications;
create policy "members can read own applications" on public.session_applications
for select using (exists (select 1 from public.members m where m.id = member_id and m.auth_user_id = auth.uid()));
drop policy if exists "admins manage applications" on public.session_applications;
create policy "admins manage applications" on public.session_applications
for all using (public.is_approved_admin()) with check (public.is_approved_admin());

create or replace function public.apply_session(p_session_id uuid, p_member_id uuid)
returns public.session_application_status
language plpgsql security definer set search_path = public
as $$
declare
  target public.session_instances;
  active_count integer;
  new_status public.session_application_status;
  next_position integer;
begin
  select * into target from public.session_instances where id = p_session_id for update;
  if target.id is null then raise exception 'session not found'; end if;
  if target.status <> 'scheduled' then raise exception 'session is canceled'; end if;
  if now() < target.application_open_at then raise exception 'application is not open'; end if;
  if now() >= target.start_at then raise exception 'session has started'; end if;
  if not exists (select 1 from public.members where id = p_member_id and status = 'approved') then
    raise exception 'member is not approved';
  end if;
  if exists (select 1 from public.session_applications where session_id = p_session_id and member_id = p_member_id and status in ('confirmed', 'waitlisted')) then
    raise exception 'member already applied';
  end if;

  select count(*) into active_count from public.session_applications
    where session_id = p_session_id and status = 'confirmed';
  if active_count < target.capacity then
    new_status := 'confirmed'; next_position := null;
  else
    new_status := 'waitlisted';
    select coalesce(max(waitlist_position), 0) + 1 into next_position
      from public.session_applications where session_id = p_session_id and status = 'waitlisted';
  end if;
  insert into public.session_applications(session_id, member_id, status, waitlist_position)
    values (p_session_id, p_member_id, new_status, next_position);
  return new_status;
end;
$$;

create or replace function public.cancel_session_application(p_application_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target public.session_applications;
  promoted public.session_applications;
begin
  select a.* into target from public.session_applications a
    join public.session_instances s on s.id = a.session_id
    where a.id = p_application_id and a.status in ('confirmed', 'waitlisted') and s.start_at > now()
    for update;
  if target.id is null then raise exception 'cancelable application not found'; end if;
  update public.session_applications set status = 'canceled', waitlist_position = null, updated_at = now() where id = target.id;

  if target.status = 'confirmed' then
    select * into promoted from public.session_applications
      where session_id = target.session_id and status = 'waitlisted'
      order by waitlist_position asc, applied_at asc
      for update skip locked limit 1;
    if promoted.id is not null then
      update public.session_applications set status = 'confirmed', waitlist_position = null, updated_at = now() where id = promoted.id;
      update public.session_applications set waitlist_position = waitlist_position - 1, updated_at = now()
        where session_id = target.session_id and status = 'waitlisted' and waitlist_position > promoted.waitlist_position;
    end if;
  else
    update public.session_applications set waitlist_position = waitlist_position - 1, updated_at = now()
      where session_id = target.session_id and status = 'waitlisted' and waitlist_position > target.waitlist_position;
  end if;
end;
$$;
