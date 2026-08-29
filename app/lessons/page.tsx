import { requireApprovedMember } from "@/lib/auth/require-admin";
import { listLessonCourts, listMyLessonBookings, listLessonSlots } from "@/lib/services/lesson-service";
import { bookLessonAction, cancelLessonAction } from "./actions";

export const dynamic = "force-dynamic";

function dateInKorea(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

export default async function LessonsPage({ searchParams }: { searchParams: Promise<{ error?: string; result?: string }> }) {
  const member = await requireApprovedMember();
  const from = dateInKorea(0); const to = dateInKorea(14);
  const [courts, slots, bookings] = await Promise.all([
    listLessonCourts().catch(() => []), listLessonSlots(from, to).catch(() => []), listMyLessonBookings(member.id).catch(() => [])
  ]);
  const courtNames = new Map(courts.map((court) => [court.id, court.name]));
  const bookingBySlot = new Map(bookings.map((booking) => [booking.slot_id, booking]));
  const query = await searchParams;
  const message = query.result === "booked" ? "레슨을 예약했습니다."
    : query.result === "canceled" ? "레슨 예약을 취소하고 회원권을 복구했습니다."
    : query.error === "membership" ? "사용 가능한 회원권이 없습니다."
    : query.error === "cutoff" ? "레슨 시작 12시간 전까지만 취소할 수 있습니다."
    : query.error === "unavailable" ? "이미 예약되었거나 예약할 수 없는 슬롯입니다."
    : query.error === "failed" ? "예약 처리에 실패했습니다. 잠시 후 다시 시도해주세요." : null;
  const slotsByDate = new Map<string, typeof slots>();
  for (const slot of slots) slotsByDate.set(slot.slot_date, [...(slotsByDate.get(slot.slot_date) ?? []), slot]);
  return <div className="stack">
    <section className="card"><span className="eyebrow">Lessons</span><h1 style={{ marginTop: 12 }}>레슨 예약</h1><p className="muted">코트와 시간을 선택해 예약하세요. 예약 시 회원권 1회가 차감됩니다.</p>{message ? <div className="notice" style={{ marginTop: 20 }}>{message}</div> : null}
      {courts.length === 0 ? <div className="notice" style={{ marginTop: 24 }}>운영 중인 코트가 아직 등록되지 않았습니다.</div> : slotsByDate.size === 0 ? <p className="subtle" style={{ marginTop: 24 }}>예약 가능한 슬롯이 없습니다.</p> : <div className="lesson-calendar" style={{ marginTop: 24 }}>{Array.from(slotsByDate.entries()).map(([date, dateSlots]) => <div className="lesson-day" key={date}><div className="lesson-day-heading"><strong>{date}</strong><span className="subtle">{new Date(`${date}T12:00:00Z`).toLocaleDateString("ko-KR", { weekday: "short" })}</span></div><div className="lesson-slots">{dateSlots.map((slot) => { const booking = bookingBySlot.get(slot.id); const isAvailable = slot.status === "available"; return <div className={`lesson-slot ${isAvailable ? "" : "lesson-slot-unavailable"}`} key={slot.id}><div><strong>{courtNames.get(slot.court_id) ?? "코트"}</strong><span className="subtle">{new Date(slot.start_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}–{new Date(slot.end_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span></div>{booking ? <form action={cancelLessonAction}><input type="hidden" name="booking_id" value={booking.id} /><button className="btn btn-compact btn-danger" type="submit">예약 취소</button></form> : isAvailable ? <form action={bookLessonAction}><input type="hidden" name="slot_id" value={slot.id} /><button className="btn btn-compact btn-primary" type="submit">예약하기</button></form> : <span className="subtle">예약 불가</span>}</div>; })}</div></div>)}</div>}
    </section>
  </div>;
}
