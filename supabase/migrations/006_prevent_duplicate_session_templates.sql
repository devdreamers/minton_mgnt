-- 기존 중복 데이터는 보존하고, 동일한 소모임 템플릿의 신규 저장·수정을 차단한다.
create or replace function public.prevent_duplicate_session_template()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.session_templates existing
    where existing.id <> new.id
      and lower(btrim(existing.title)) = lower(btrim(new.title))
      and existing.day_of_week = new.day_of_week
      and existing.start_time = new.start_time
      and existing.end_time = new.end_time
  ) then
    raise exception 'session template already exists';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_session_template_trigger on public.session_templates;
create trigger prevent_duplicate_session_template_trigger
  before insert or update of title, day_of_week, start_time, end_time
  on public.session_templates
  for each row
  execute function public.prevent_duplicate_session_template();
