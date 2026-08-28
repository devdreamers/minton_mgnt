import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { listApplicationsForSession, listSessionTemplates, listUpcomingSessions } from "@/lib/services/session-service";
import { cancelSessionAction, createInstanceAction, createTemplateAction } from "./actions";
import { SessionInstanceForm } from "./session-instance-form";

const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
export const dynamic = "force-dynamic";

export default async function AdminSessionsPage({ searchParams }: { searchParams: Promise<{ result?: string; error?: string }> }) {
  await requireApprovedAdmin();
  const [templates, sessions] = await Promise.all([listSessionTemplates().catch(() => []), listUpcomingSessions().catch(() => [])]);
  const applicationEntries = await Promise.all(sessions.slice(0, 10).map(async (session) => [session.id, await listApplicationsForSession(session.id).catch(() => [])] as const));
  const applications = new Map(applicationEntries);
  const query = await searchParams;
  const notice = query.result === "template-created" ? "소모임 템플릿을 저장했습니다."
    : query.result === "instance-created" ? "템플릿 정보로 회차를 생성했습니다."
    : query.error === "wrong-day" ? "선택한 날짜가 템플릿의 요일과 다릅니다."
    : query.error === "duplicate" ? "같은 템플릿과 날짜의 회차가 이미 있습니다."
    : query.error === "create-failed" ? "회차 생성에 실패했습니다. 입력 내용을 확인해주세요."
    : null;
  const isError = Boolean(query.error);

  return <div className="stack">
    {notice ? <div className={isError ? "notice danger" : "notice"}>{notice}</div> : null}
    <section className="card">
      <span className="eyebrow">Session templates</span><h1 style={{ marginTop: 12 }}>소모임 템플릿</h1>
      <p className="muted">반복 운영할 소모임의 요일, 시간, 정원을 한 번만 등록합니다.</p>
      <form className="form" action={createTemplateAction} style={{ marginTop: 20 }}>
        <div className="grid cols-3"><div className="field"><label>소모임명</label><input name="title" placeholder="수요일 정모" required /></div><div className="field"><label>요일</label><select name="day_of_week" defaultValue="3">{days.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></div><div className="field"><label>정원</label><input name="capacity" type="number" min={1} defaultValue={16} required /></div></div>
        <div className="grid cols-3"><div className="field"><label>시작</label><input name="start_time" type="time" defaultValue="19:00" required /></div><div className="field"><label>종료</label><input name="end_time" type="time" defaultValue="22:00" required /></div><div className="field"><label>신청 오픈</label><input name="application_open_time" type="time" defaultValue="10:00" required /></div></div>
        <button className="btn btn-primary" type="submit">템플릿 저장</button>
      </form>
      <div style={{ overflowX: "auto", marginTop: 24 }}><table className="table"><thead><tr><th>이름</th><th>요일/시간</th><th>정원</th><th>신청 오픈</th></tr></thead><tbody>{templates.length === 0 ? <tr><td colSpan={4} className="subtle">등록된 템플릿이 없습니다.</td></tr> : templates.map((template) => <tr key={template.id}><td><strong>{template.title}</strong></td><td>{days[template.day_of_week]} {template.start_time.slice(0, 5)}–{template.end_time.slice(0, 5)}</td><td>{template.capacity}명</td><td>{template.application_open_time.slice(0, 5)}</td></tr>)}</tbody></table></div>
    </section>
    <section className="card">
      <span className="eyebrow">Session instances</span><h2 style={{ marginTop: 12 }}>회차 생성</h2>
      <p className="muted">템플릿을 선택하고 날짜만 입력하세요. 시간·신청 오픈·정원은 자동으로 적용됩니다.</p>
      {templates.length === 0 ? <div className="notice" style={{ marginTop: 20 }}>먼저 소모임 템플릿을 등록해주세요.</div> : <SessionInstanceForm templates={templates} days={days} action={createInstanceAction} />}
      <div style={{ overflowX: "auto", marginTop: 28 }}><table className="table"><thead><tr><th>회차</th><th>신청자</th><th>상태</th><th>작업</th></tr></thead><tbody>{sessions.length === 0 ? <tr><td colSpan={4} className="subtle">생성된 회차가 없습니다.</td></tr> : sessions.map((session) => { const apps = applications.get(session.id) ?? []; return <tr key={session.id}><td><strong>{session.session_templates?.title ?? "소모임"}</strong><div className="subtle">{session.session_date} · {new Date(session.start_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</div></td><td>{apps.filter((application) => application.status === "confirmed").length}/{session.capacity}명<div className="subtle">대기 {apps.filter((application) => application.status === "waitlisted").length}명</div></td><td>{session.status}</td><td>{session.status === "scheduled" ? <form action={cancelSessionAction}><input type="hidden" name="session_id" value={session.id} /><button className="btn" type="submit">회차 취소</button></form> : "-"}</td></tr>; })}</tbody></table></div>
    </section>
  </div>;
}
