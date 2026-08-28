import Link from "next/link";
import { requireApprovedMember } from "@/lib/auth/require-admin";
import { listMyApplications, listUpcomingSessions } from "@/lib/services/session-service";
import { applySessionAction, cancelApplicationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const member = await requireApprovedMember();
  const [sessions, myApplications] = await Promise.all([listUpcomingSessions().catch(() => []), listMyApplications(member.id).catch(() => [])]);
  const error = (await searchParams).error;
  const errorMessage = error === "not-open" ? "아직 신청 오픈 전입니다. 오픈 시각 이후에 신청해주세요."
    : error === "started" ? "이미 시작된 소모임은 신청할 수 없습니다."
    : error === "already-applied" ? "이미 신청한 소모임입니다."
    : error === "failed" ? "신청에 실패했습니다. 잠시 후 다시 시도해주세요."
    : null;
  const mine = new Map(myApplications.map((application) => [application.session_id, application]));
  return <div className="stack"><section className="card"><span className="eyebrow">Sessions</span><h1 style={{ marginTop: 12 }}>소모임 신청</h1><p className="muted">신청 오픈 시각 이후부터 선착순으로 신청할 수 있습니다. 정원이 차면 대기자로 등록됩니다.</p>{errorMessage ? <div className="notice danger" style={{ marginTop: 20 }}>{errorMessage}</div> : null}<div className="grid cols-2" style={{ marginTop: 24 }}>{sessions.length === 0 ? <p className="subtle">예정된 소모임이 없습니다.</p> : sessions.map((session) => { const application = mine.get(session.id); const now = Date.now(); const opensAt = new Date(session.application_open_at).getTime(); const startsAt = new Date(session.start_at).getTime(); const canApply = session.status === "scheduled" && now >= opensAt && now < startsAt; return <article className="grid-card" key={session.id}><span className="pill">{session.status === "scheduled" ? "예정" : "취소"}</span><h3>{session.session_templates?.title ?? "소모임"}</h3><p className="muted">{session.session_date} · {new Date(session.start_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 시작</p><p className="subtle">신청 오픈: {new Date(session.application_open_at).toLocaleString("ko-KR")} · 정원 {session.capacity}명</p>{application ? <div className="inline-actions"><span className="pill">{application.status === "confirmed" ? "참가 확정" : `대기 ${application.waitlist_position ?? ""}번`}</span><form action={cancelApplicationAction}><input type="hidden" name="application_id" value={application.id} /><button className="btn" type="submit">신청 취소</button></form></div> : <form action={applySessionAction}><input type="hidden" name="session_id" value={session.id} /><button className="btn btn-primary" type="submit" disabled={!canApply}>{session.status !== "scheduled" ? "취소된 회차" : now < opensAt ? "신청 오픈 전" : now >= startsAt ? "신청 마감" : "신청하기"}</button></form>}</article>; })}</div></section><p className="subtle"><Link href="/memberships">내 회원권 보기 →</Link> · 소모임 신청은 회원권을 차감하지 않습니다.</p></div>;
}
