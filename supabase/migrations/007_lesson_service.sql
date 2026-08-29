do $$ begin
  create type public.lesson_slot_status as enum ('available', 'booked', 'blocked', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lesson_booking_source_type as enum ('member', 'trial_guest', 'admin_block');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lesson_booking_status as enum ('confirmed', 'canceled');
exception when duplicate_object then null; end $$;

create table if not exists public.lesson_courts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_schedule_templates (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.lesson_courts(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  slot_interval_minutes integer not null check (slot_interval_minutes > 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (court_id, day_of_week)
);

create table if not exists public.lesson_slots (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.lesson_courts(id) on delete cascade,
  slot_date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.lesson_slot_status not null default 'available',
  created_at timestamptz not null default now(),
  unique (court_id, start_at)
);

create table if not exists public.lesson_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null unique references public.lesson_slots(id) on delete restrict,
  member_id uuid references public.members(id) on delete set null,
  membership_id uuid references public.memberships(id) on delete set null,
  source_type public.lesson_booking_source_type not null,
  guest_name text,
  guest_memo text,
  status public.lesson_booking_status not null default 'confirmed',
  canceled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lesson_slots_date_idx on public.lesson_slots (slot_date, start_at);
create index if not exists lesson_slots_court_date_idx on public.lesson_slots (court_id, slot_date, start_at);
create index if not exists lesson_bookings_member_idx on public.lesson_bookings (member_id, status);

alter table public.lesson_courts enable row level security;
alter table public.lesson_schedule_templates enable row level security;
alter table public.lesson_slots enable row level security;
alter table public.lesson_bookings enable row level security;

drop policy if exists "members can read active lesson courts" on public.lesson_courts;
create policy "members can read active lesson courts" on public.lesson_courts for select using (is_active or public.is_approved_admin());
drop policy if exists "admins manage lesson courts" on public.lesson_courts;
create policy "admins manage lesson courts" on public.lesson_courts for all using (public.is_approved_admin()) with check (public.is_approved_admin());
drop policy if exists "members can read active lesson schedules" on public.lesson_schedule_templates;
create policy "members can read active lesson schedules" on public.lesson_schedule_templates for select using (is_active or public.is_approved_admin());
drop policy if exists "admins manage lesson schedules" on public.lesson_schedule_templates;
create policy "admins manage lesson schedules" on public.lesson_schedule_templates for all using (public.is_approved_admin()) with check (public.is_approved_admin());
drop policy if exists "members can read available lesson slots" on public.lesson_slots;
create policy "members can read available lesson slots" on public.lesson_slots for select using (status = 'available' or public.is_approved_admin());
drop policy if exists "admins manage lesson slots" on public.lesson_slots;
create policy "admins manage lesson slots" on public.lesson_slots for all using (public.is_approved_admin()) with check (public.is_approved_admin());
drop policy if exists "members can read own lesson bookings" on public.lesson_bookings;
create policy "members can read own lesson bookings" on public.lesson_bookings for select using (exists (select 1 from public.members m where m.id = member_id and m.auth_user_id = auth.uid()));
drop policy if exists "admins manage lesson bookings" on public.lesson_bookings;
create policy "admins manage lesson bookings" on public.lesson_bookings for all using (public.is_approved_admin()) with check (public.is_approved_admin());

create or replace function public.generate_lesson_slots(p_from_date date, p_to_date date)
returns integer language plpgsql security definer set search_path = public as $$
declare
  current_date_value date;
  schedule record;
  slot_start timestamptz;
  slot_end timestamptz;
  day_end timestamptz;
  created_count integer := 0;
begin
  if p_to_date < p_from_date then raise exception 'invalid date range'; end if;
  for current_date_value in select generate_series(p_from_date, p_to_date, interval '1 day')::date loop
    for schedule in select * from public.lesson_schedule_templates where is_active and day_of_week = extract(dow from current_date_value) loop
      slot_start := (current_date_value::text || 'T' || schedule.start_time::text || '+09:00')::timestamptz;
      day_end := (current_date_value::text || 'T' || schedule.end_time::text || '+09:00')::timestamptz;
      while slot_start < day_end loop
        slot_end := slot_start + make_interval(mins => schedule.slot_interval_minutes);
        if slot_end <= day_end then
          insert into public.lesson_slots(court_id, slot_date, start_at, end_at)
          values (schedule.court_id, current_date_value, slot_start, slot_end)
          on conflict (court_id, start_at) do nothing;
          if found then created_count := created_count + 1; end if;
        end if;
        slot_start := slot_end;
      end loop;
    end loop;
  end loop;
  return created_count;
end;
$$;

create or replace function public.book_lesson(p_slot_id uuid, p_member_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  target public.lesson_slots;
  selected_membership_id uuid;
  booking_id uuid;
begin
  select * into target from public.lesson_slots where id = p_slot_id for update;
  if target.id is null then raise exception 'lesson slot not found'; end if;
  if target.status <> 'available' or target.start_at <= now() then raise exception 'lesson slot is not available'; end if;
  if not exists (select 1 from public.members where id = p_member_id and status = 'approved') then raise exception 'member is not approved'; end if;
  selected_membership_id := public.consume_membership(p_member_id, 'lesson booking');
  insert into public.lesson_bookings(slot_id, member_id, membership_id, source_type, created_by)
  values (p_slot_id, p_member_id, selected_membership_id, 'member', auth.uid()) returning id into booking_id;
  update public.lesson_slots set status = 'booked' where id = p_slot_id;
  return booking_id;
end;
$$;

create or replace function public.cancel_lesson_booking(p_booking_id uuid, p_member_id uuid, p_cutoff_hours integer default 12)
returns void language plpgsql security definer set search_path = public as $$
declare
  target public.lesson_bookings;
  slot public.lesson_slots;
begin
  select b.* into target from public.lesson_bookings b where b.id = p_booking_id and b.member_id = p_member_id and b.status = 'confirmed' for update;
  if target.id is null then raise exception 'lesson booking not found'; end if;
  select * into slot from public.lesson_slots where id = target.slot_id for update;
  if slot.start_at <= now() + make_interval(hours => p_cutoff_hours) then raise exception 'lesson booking is no longer cancelable'; end if;
  if target.membership_id is not null then
    update public.memberships set remaining_count = remaining_count + 1, status = 'active', updated_at = now() where id = target.membership_id;
    insert into public.membership_logs(membership_id, change_type, change_amount, reason, created_by)
    values (target.membership_id, 'restore', 1, 'lesson booking cancellation', auth.uid());
  end if;
  update public.lesson_bookings set status = 'canceled', canceled_at = now() where id = target.id;
  update public.lesson_slots set status = 'available' where id = slot.id;
end;
$$;
