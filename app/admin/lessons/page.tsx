import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { listLessonCourts, listLessonSchedules } from "@/lib/services/lesson-service";
import { createCourtAction, createScheduleAction, generateSlotsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage() {
  await requireApprovedAdmin();
  const [courts, schedules] = await Promise.all([listLessonCourts().catch(() => []), listLessonSchedules().catch(() => [])]);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return (
    <div className="stack">
    <section className="card">
      <span className="eyebrow">Lessons</span>
      <h1>레슨 관리</h1><p className="muted">코트별 운영시간을 등록하고 예약 슬롯을 생성합니다.</p>
      <form className="inline-actions" action={createCourtAction} style={{ marginTop: 24 }}><input name="name" placeholder="A 코트" required /><button className="btn btn-primary" type="submit">코트 추가</button></form>
      <form className="form" action={createScheduleAction} style={{ marginTop: 18 }}><div className="grid cols-3"><div className="field"><label>코트</label><select name="court_id" required>{courts.map((court) => <option value={court.id} key={court.id}>{court.name}</option>)}</select></div><div className="field"><label>요일</label><select name="day_of_week" defaultValue="1">{days.map((day, index) => <option value={index} key={day}>{day}요일</option>)}</select></div><div className="field"><label>슬롯 간격(분)</label><input name="slot_interval_minutes" type="number" min="1" defaultValue="30" required /></div></div><div className="grid cols-2"><div className="field"><label>운영 시작</label><input name="start_time" type="time" defaultValue="10:00" required /></div><div className="field"><label>운영 종료</label><input name="end_time" type="time" defaultValue="22:00" required /></div></div><button className="btn btn-primary" type="submit" disabled={courts.length === 0}>운영시간 저장</button></form>
      <div style={{ overflowX: "auto", marginTop: 24 }}><table className="table"><thead><tr><th>코트</th><th>요일</th><th>운영시간</th><th>간격</th></tr></thead><tbody>{schedules.map((schedule) => <tr key={schedule.id}><td>{courts.find((court) => court.id === schedule.court_id)?.name ?? "-"}</td><td>{days[schedule.day_of_week]}요일</td><td>{schedule.start_time.slice(0, 5)}–{schedule.end_time.slice(0, 5)}</td><td>{schedule.slot_interval_minutes}분</td></tr>)}</tbody></table></div>
      <form className="inline-actions" action={generateSlotsAction} style={{ marginTop: 24 }}><input name="from_date" type="date" required /><span>~</span><input name="to_date" type="date" required /><button className="btn btn-primary" type="submit">슬롯 생성</button></form>
    </section>
    </div>
  );
}
