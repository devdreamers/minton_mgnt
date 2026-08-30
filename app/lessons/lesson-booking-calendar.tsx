"use client";

import { useMemo, useState } from "react";
import type { LessonBooking, LessonCourt, LessonSlot, Membership } from "@/lib/types";
import { bookLessonAction, cancelLessonAction } from "./actions";

const formatDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
const weekday = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("ko-KR", { weekday: "short" });
const time = (value: string) => new Date(value).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

export function LessonBookingCalendar({ courts, slots, bookings, myBookings, memberships, fromDate, toDate }: { courts: LessonCourt[]; slots: LessonSlot[]; bookings: LessonBooking[]; myBookings: (LessonBooking & { lesson_slots: LessonSlot | null })[]; memberships: Membership[]; fromDate: string; toDate: string }) {
  const [selectedDate, setSelectedDate] = useState(fromDate);
  const [selectedCourt, setSelectedCourt] = useState(courts[0]?.id ?? "");
  const [selectedMembership, setSelectedMembership] = useState(memberships.find((membership) => membership.status === "active" && membership.remaining_count > 0)?.id ?? "");
  const dates = useMemo(() => { const result: string[] = []; const cursor = new Date(`${fromDate}T12:00:00Z`); const end = new Date(`${toDate}T12:00:00Z`); while (cursor <= end) { result.push(cursor.toISOString().slice(0, 10)); cursor.setUTCDate(cursor.getUTCDate() + 1); } return result; }, [fromDate, toDate]);
  const selectedSlots = slots.filter((slot) => slot.slot_date === selectedDate && slot.court_id === selectedCourt);
  const bookingBySlot = new Map(bookings.map((booking) => [booking.slot_id, booking]));
  const myBookingBySlot = new Map(myBookings.map((booking) => [booking.slot_id, booking]));
  const activeMemberships = memberships.filter((membership) => membership.status === "active" && membership.remaining_count > 0);

  return <div className="lesson-booking-flow">
    <div className="lesson-calendar-strip">{dates.map((date) => <button className={`lesson-date ${selectedDate === date ? "selected" : ""}`} type="button" key={date} onClick={() => setSelectedDate(date)}><span>{formatDate(date)}</span><strong>{date === fromDate ? "오늘" : weekday(date)}</strong><small>{slots.some((slot) => slot.slot_date === date && slot.status === "available") ? "예약 가능" : "예약 불가"}</small></button>)}</div>
    <div className="lesson-step-grid"><section className="lesson-step"><span className="lesson-step-number">1</span><div><h2>티켓 선택</h2><p className="subtle">예약 시 선택한 회원권에서 1회 차감됩니다.</p></div><div className="lesson-ticket-list">{activeMemberships.length === 0 ? <div className="notice danger">사용 가능한 회원권이 없습니다.</div> : activeMemberships.map((membership) => <button className={`lesson-ticket ${selectedMembership === membership.id ? "selected" : ""}`} type="button" key={membership.id} onClick={() => setSelectedMembership(membership.id)}><strong>{membership.title}</strong><span>잔여 {membership.remaining_count}회</span></button>)}</div></section><section className="lesson-step"><span className="lesson-step-number">2</span><div><h2>코트 선택</h2><p className="subtle">같은 시간에도 코트별로 예약할 수 있습니다.</p></div><div className="lesson-choice-row">{courts.map((court) => <button className={`lesson-choice ${selectedCourt === court.id ? "selected" : ""}`} type="button" key={court.id} onClick={() => setSelectedCourt(court.id)}>{court.name}</button>)}</div></section></div>
    <section className="lesson-step lesson-time-step"><span className="lesson-step-number">3</span><div><h2>시간 선택</h2><p className="subtle">{selectedDate} · {courts.find((court) => court.id === selectedCourt)?.name ?? "코트"}</p></div><div className="lesson-time-grid">{selectedSlots.length === 0 ? <p className="subtle">선택한 날짜와 코트에 생성된 슬롯이 없습니다.</p> : selectedSlots.map((slot) => { const booking = bookingBySlot.get(slot.id); const mine = myBookingBySlot.get(slot.id); const available = slot.status === "available" && !booking; return <div className={`lesson-time-button ${available ? "" : "unavailable"}`} key={slot.id}><span>{time(slot.start_at)}</span><small>{booking ? "예약됨 (1/1)" : slot.status === "available" ? "예약 가능 (0/1)" : "예약 불가"}</small>{mine ? <form action={cancelLessonAction}><input type="hidden" name="booking_id" value={mine.id} /><button className="btn btn-compact btn-danger" type="submit">내 예약 취소</button></form> : available ? <form action={bookLessonAction}><input type="hidden" name="slot_id" value={slot.id} /><input type="hidden" name="membership_id" value={selectedMembership} /><button className="btn btn-compact btn-primary" type="submit" disabled={!selectedMembership}>예약하기</button></form> : null}</div>; })}</div></section>
  </div>;
}
