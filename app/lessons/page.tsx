import { requireApprovedMember } from "@/lib/auth/require-admin";
import { listConfirmedLessonBookings, listLessonCourts, listLessonSlots, listMyLessonBookings } from "@/lib/services/lesson-service";
import { listMembershipsForMember } from "@/lib/services/membership-service";
import { LessonBookingCalendar } from "./lesson-booking-calendar";

export const dynamic = "force-dynamic";

function dateInKorea(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

export default async function LessonsPage({ searchParams }: { searchParams: Promise<{ error?: string; result?: string }> }) {
  const member = await requireApprovedMember();
  const from = dateInKorea(0); const to = dateInKorea(14);
  const [courts, slots, bookings, allBookings, memberships] = await Promise.all([
    listLessonCourts().catch(() => []), listLessonSlots(from, to).catch(() => []), listMyLessonBookings(member.id).catch(() => []),
    listLessonSlots(from, to).then((items) => listConfirmedLessonBookings(items.map((item) => item.id))).catch(() => []),
    listMembershipsForMember(member.id).catch(() => [])
  ]);
  const query = await searchParams;
  const message = query.result === "booked" ? "레슨을 예약했습니다."
    : query.result === "canceled" ? "레슨 예약을 취소하고 회원권을 복구했습니다."
    : query.error === "membership" ? "사용 가능한 회원권이 없습니다."
    : query.error === "cutoff" ? "레슨 시작 12시간 전까지만 취소할 수 있습니다."
    : query.error === "unavailable" ? "이미 예약되었거나 예약할 수 없는 슬롯입니다."
    : query.error === "failed" ? "예약 처리에 실패했습니다. 잠시 후 다시 시도해주세요." : null;
  return <div className="stack">
    <section className="card"><span className="eyebrow">Lessons</span><h1 style={{ marginTop: 12 }}>레슨 예약</h1><p className="muted">날짜, 티켓, 코트를 선택한 뒤 원하는 시간에 예약하세요. 예약 시 회원권 1회가 차감됩니다.</p>{message ? <div className="notice" style={{ marginTop: 20 }}>{message}</div> : null}{courts.length === 0 ? <div className="notice" style={{ marginTop: 24 }}>운영 중인 코트가 아직 등록되지 않았습니다.</div> : <LessonBookingCalendar courts={courts} slots={slots} bookings={allBookings} myBookings={bookings} memberships={memberships} fromDate={from} toDate={to} />}</section>
  </div>;
}
