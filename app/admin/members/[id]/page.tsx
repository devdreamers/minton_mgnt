import Link from "next/link";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { getMemberById } from "@/lib/services/member-service";
import { listMembershipLogsForMember, listMembershipsForMember } from "@/lib/services/membership-service";

const changeLabels = { issue: "발급", use: "사용", expire: "만료", restore: "복구", cancel: "취소" } as const;

export const dynamic = "force-dynamic";

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedAdmin();
  const { id } = await params;
  const [member, memberships, logs] = await Promise.all([
    getMemberById(id),
    listMembershipsForMember(id),
    listMembershipLogsForMember(id)
  ]);

  return <div className="stack">
    <section className="page-heading admin-heading">
      <Link className="subtle" href="/admin/members">← 회원 목록</Link>
      <span className="eyebrow" style={{ marginTop: 20 }}>Member detail</span>
      <h1>{member.name}</h1>
      <p>{member.phone ?? "전화번호 미입력"} · {member.email ?? "이메일 미입력"} · 급수 {member.skill_level}</p>
    </section>
    <section className="card">
      <div className="section-label"><h2>회원권 목록</h2><span className="subtle">{memberships.length}개</span></div>
      <div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>회원권</th><th>발급 유형</th><th>잔여</th><th>기간</th><th>상태</th></tr></thead><tbody>
        {memberships.length === 0 ? <tr><td colSpan={5} className="subtle">발급된 회원권이 없습니다.</td></tr> : memberships.map((membership) => <tr key={membership.id}><td><strong>{membership.title}</strong>{membership.memo ? <div className="subtle">{membership.memo}</div> : null}</td><td>{membership.source_type}</td><td>{membership.remaining_count} / {membership.total_count}회</td><td>{membership.start_date ?? "-"} ~ {membership.end_date ?? "-"}</td><td>{membership.status}</td></tr>)}
      </tbody></table></div>
    </section>
    <section className="card">
      <div className="section-label"><h2>회원권 히스토리</h2><span className="subtle">발급·사용·상태 변경</span></div>
      <div style={{ overflowX: "auto" }}><table className="table"><thead><tr><th>일시</th><th>회원권</th><th>구분</th><th>횟수</th><th>사유</th></tr></thead><tbody>
        {logs.length === 0 ? <tr><td colSpan={5} className="subtle">기록이 없습니다.</td></tr> : logs.map((log) => { const membership = memberships.find((item) => item.id === log.membership_id); return <tr key={log.id}><td>{new Date(log.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</td><td>{membership?.title ?? "회원권"}</td><td>{changeLabels[log.change_type]}</td><td>{log.change_amount}</td><td>{log.reason ?? "-"}</td></tr>; })}
      </tbody></table></div>
    </section>
  </div>;
}
