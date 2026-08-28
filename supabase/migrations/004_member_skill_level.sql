-- 회원 급수는 운영 중 급수 체계가 바뀔 수 있으므로 text로 저장하고
-- 애플리케이션에서 표준 선택지를 관리한다.
alter table public.members
  add column if not exists skill_level text not null default '미정';

create index if not exists members_skill_level_idx
  on public.members (skill_level);
