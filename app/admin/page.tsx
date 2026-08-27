import Link from "next/link";
import { listMembers } from "@/lib/services/member-service";
import { listMembershipProducts } from "@/lib/services/membership-service";
import { listUpcomingSessions } from "@/lib/services/session-service";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";

const sections = [
  {
    href: "/admin/members",
    title: "회원 목록",
    description: "회원 현황 및 가입 승인"
  },
  {
    href: "/admin/memberships",
    title: "회원권 발급",
    description: "정식·프로모션·복구 발급"
  },
  {
    href: "/admin/products",
    title: "상품 목록",
    description: "회원권 상품 등록 및 수정"
  },
  {
    href: "/admin/sessions",
    title: "소모임 관리",
    description: "템플릿, 회차, 신청자 관리"
  },
  {
    href: "/admin/lessons",
    title: "레슨 목록",
    description: "코트별 레슨 일정 관리"
  }
] as const;

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireApprovedAdmin();
  const [members, products, sessions] = await Promise.all([
    listMembers().catch(() => []),
    listMembershipProducts().catch(() => []),
    listUpcomingSessions().catch(() => [])
  ]);
  const pendingCount = members.filter((member) => member.status === "pending").length;
  const approvedCount = members.filter((member) => member.status === "approved").length;

  return (
    <>
      <section className="page-heading admin-heading">
        <span className="eyebrow">Admin console</span>
        <h1>오늘의 운영 현황</h1>
        <p>반복해서 확인하는 숫자와 처리할 업무를 한 화면에 모았습니다.</p>
      </section>

      <section className="admin-stats" aria-label="운영 현황 요약">
        <div className="stat-card"><span>승인 대기</span><strong>{pendingCount}</strong><small>처리 필요</small></div>
        <div className="stat-card"><span>승인 회원</span><strong>{approvedCount}</strong><small>현재 활성 회원</small></div>
        <div className="stat-card"><span>활성 상품</span><strong>{products.filter((product) => product.is_active).length}</strong><small>회원권 상품</small></div>
        <div className="stat-card"><span>예정 소모임</span><strong>{sessions.length}</strong><small>다가오는 회차</small></div>
      </section>

      <section className="section">
        <div className="section-label"><h2>운영 메뉴</h2><span className="subtle">도메인별 관리</span></div>
        <div className="grid cols-2">
          {sections.map((section) => (
            <Link className="card" href={section.href} key={section.href}>
              <span className="pill">{section.title}</span>
              <h3>{section.description}</h3>
              <p className="subtle">관리 화면 열기 <span className="card-link-arrow">→</span></p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-label"><h2>다음 확장 영역</h2><span className="subtle">PRD roadmap</span></div>
        <div className="roadmap-card">
          <div><span className="card-kicker">LESSON · MATCH</span><h3>레슨과 매치 운영을 같은 콘솔에 연결합니다.</h3></div>
          <p className="subtle">현재 메뉴 계층을 유지한 채 레슨 일정, 코트 블록, 게스트 및 대진표 기능을 도메인별로 추가할 수 있습니다.</p>
        </div>
      </section>
    </>
  );
}
