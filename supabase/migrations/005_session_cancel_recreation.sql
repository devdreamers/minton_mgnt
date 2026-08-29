-- 취소된 회차는 이력을 보존하고, 같은 템플릿·날짜로 새 예정 회차를 만들 수 있게 한다.
alter table public.session_instances
  drop constraint if exists session_instances_template_id_session_date_key;

create unique index if not exists session_instances_scheduled_template_date_idx
  on public.session_instances (template_id, session_date)
  where status = 'scheduled';
