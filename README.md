# minton mngt

배드민턴 센터 운영 사이트의 MVP1 시작점입니다.

## 현재 상태

- Next.js App Router 기반 UI 스캐폴딩
- Supabase 인증 연결 뼈대
- member / membership 스키마 마이그레이션
- 관리자 승인, 회원권 상품, 회원권 발급 화면
- 소모임 템플릿/회차 관리와 회원 신청·대기자 화면

## 로컬 실행

1. `.env.example`을 복사해 `.env.local`을 만듭니다.
2. Supabase 프로젝트를 만들고 마이그레이션을 적용합니다.
3. `npm install`
4. `npm run dev`

## Supabase Keys

- 브라우저용: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 서버용: `SUPABASE_SECRET_KEY`
- legacy fallback: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## MVP1 포함 범위

- Google 로그인
- Kakao OIDC 로그인
- 가입 회원 자동 생성 트리거
- 관리자 승인/거절
- 회원권 상품 CRUD
- 회원권 발급
- 회원 본인 잔여 조회
- `consume_membership` RPC
- `apply_session` / `cancel_session_application` RPC
