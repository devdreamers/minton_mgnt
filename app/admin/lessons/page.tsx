import { requireApprovedAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage() {
  await requireApprovedAdmin();
  return (
    <section className="card empty-state">
      <span className="eyebrow">Lessons</span>
      <h1>레슨 목록</h1>
      <p className="muted">코트별 레슨 일정과 예약 슬롯을 관리하는 화면입니다.</p>
      <div className="notice" style={{ marginTop: 24 }}>
        레슨 서비스는 다음 개발 단계에서 추가됩니다. A/B 코트, 운영시간, 슬롯 차단,
        회원권 차감 정책을 이 화면에 연결할 예정입니다.
      </div>
    </section>
  );
}
