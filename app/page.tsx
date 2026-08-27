import Link from "next/link";
import { getCurrentMemberByAuthUserId } from "@/lib/services/member-service";
import { getCurrentUser } from "@/lib/supabase/server";

const milestones = [
  {
    title: "MVP1 범위",
    description: "회원 승인, 회원권 상품, 회원권 발급/차감, 본인 잔여 조회"
  },
  {
    title: "아키텍처",
    description: "Next.js App Router + Supabase + 서비스 레이어 분리"
  },
  {
    title: "다음 확장",
    description: "소모임, 레슨 예약, 대진표를 도메인별로 분리"
  }
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const member = user ? await getCurrentMemberByAuthUserId(user.id) : null;

  if (user) {
    return (
      <>
        <section className="page-heading">
          <span className="eyebrow">My space</span>
          <h1>{member?.name || "회원"}님, 오늘도 즐겁게 운동하세요.</h1>
          <p>자주 쓰는 기능을 한곳에 모았습니다. 필요한 메뉴는 ‘내 공간’에서 확인할 수 있어요.</p>
        </section>
        <section className="dashboard-grid" aria-label="회원 주요 기능">
          <Link className="dashboard-card dashboard-card-primary" href="/memberships">
            <span className="dashboard-icon">01</span>
            <div><span className="card-kicker">MEMBERSHIP</span><h2>내 회원권</h2><p>보유 중인 회원권과 잔여 횟수를 확인합니다.</p></div>
            <span className="card-arrow">→</span>
          </Link>
          <Link className="dashboard-card" href="/sessions">
            <span className="dashboard-icon">02</span>
            <div><span className="card-kicker">COMMUNITY</span><h2>소모임</h2><p>다가오는 모임을 확인하고 참가 신청합니다.</p></div>
            <span className="card-arrow">→</span>
          </Link>
          <Link className="dashboard-card" href="/profile">
            <span className="dashboard-icon">03</span>
            <div><span className="card-kicker">PROFILE</span><h2>내 정보</h2><p>이름과 전화번호를 관리합니다.</p></div>
            <span className="card-arrow">→</span>
          </Link>
          <div className="dashboard-card dashboard-card-muted">
            <span className="dashboard-icon">04</span>
            <div><span className="card-kicker">COMING SOON</span><h2>레슨 예약</h2><p>코트와 레슨 시간 예약 기능을 준비하고 있습니다.</p></div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">PRD driven MVP1</span>
          <h1>배드민턴 센터 운영의 첫 번째 운영판을 만듭니다.</h1>
          <p>
            현재 구현은 회원 관리와 회원권 관리에 집중합니다. 관리자 승인,
            상품 발급, 잔여 차감, 회원별 조회까지 MVP1의 핵심 흐름을 먼저
            고정합니다.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/login">
              소셜 로그인 시작
            </Link>
            <Link className="btn" href="/admin">
              관리자 화면
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="metric">
            <strong>회원 + 회원권</strong>
            <span className="muted">MVP1의 도메인 경계는 여기서 시작합니다.</span>
          </div>
          <div className="metric">
            <strong>Supabase 중심</strong>
            <span className="muted">인증, 스키마, RPC를 하나의 BaaS로 묶습니다.</span>
          </div>
          <div className="metric">
            <strong>서비스 레이어</strong>
            <span className="muted">UI가 테이블을 직접 만지지 않도록 분리합니다.</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>이번 구현에서 고정하는 것</h2>
        <div className="grid cols-3">
          {milestones.map((item) => (
            <article className="grid-card" key={item.title}>
              <span className="pill">{item.title}</span>
              <h3>{item.description}</h3>
              <p className="subtle">
                추후 session-service와 lesson-service가 붙어도 이 구조를 유지합니다.
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
