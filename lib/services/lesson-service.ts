import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LessonBooking, LessonCourt, LessonScheduleTemplate, LessonSlot } from "@/lib/types";

export async function listLessonCourts() {
  const { data, error } = await createSupabaseAdminClient().from("lesson_courts").select("*").eq("is_active", true).order("name");
  if (error) throw new Error(error.message);
  return data as LessonCourt[];
}

export async function listLessonSchedules() {
  const { data, error } = await createSupabaseAdminClient().from("lesson_schedule_templates").select("*").eq("is_active", true).order("court_id").order("day_of_week");
  if (error) throw new Error(error.message);
  return data as LessonScheduleTemplate[];
}

export async function createLessonCourt(name: string) {
  const { data, error } = await createSupabaseAdminClient().from("lesson_courts").insert({ name, is_active: true }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lessons"); revalidatePath("/lessons");
  return data as LessonCourt;
}

export async function createLessonSchedule(input: Omit<LessonScheduleTemplate, "id" | "created_at" | "created_by" | "is_active"> & { created_by?: string | null }) {
  const { data, error } = await createSupabaseAdminClient().from("lesson_schedule_templates").insert({ ...input, is_active: true }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lessons");
  return data as LessonScheduleTemplate;
}

export async function generateLessonSlots(fromDate: string, toDate: string) {
  const { data, error } = await createSupabaseAdminClient().rpc("generate_lesson_slots", { p_from_date: fromDate, p_to_date: toDate });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/lessons"); revalidatePath("/lessons");
  return data as number;
}

export async function listAvailableLessonSlots(fromDate: string, toDate: string) {
  const { data, error } = await createSupabaseAdminClient().from("lesson_slots").select("*").eq("status", "available").gte("slot_date", fromDate).lte("slot_date", toDate).order("slot_date").order("start_at");
  if (error) throw new Error(error.message);
  return data as LessonSlot[];
}

export async function listLessonSlots(fromDate: string, toDate: string) {
  const { data, error } = await createSupabaseAdminClient().from("lesson_slots").select("*").gte("slot_date", fromDate).lte("slot_date", toDate).order("slot_date").order("start_at");
  if (error) throw new Error(error.message);
  return data as LessonSlot[];
}

export async function listMyLessonBookings(memberId: string) {
  const { data, error } = await createSupabaseAdminClient().from("lesson_bookings").select("*, lesson_slots(*)").eq("member_id", memberId).eq("status", "confirmed").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as (LessonBooking & { lesson_slots: LessonSlot | null })[];
}

export async function bookLesson(slotId: string, memberId: string) {
  const { data, error } = await createSupabaseAdminClient().rpc("book_lesson", { p_slot_id: slotId, p_member_id: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/lessons"); revalidatePath("/memberships");
  return data as string;
}

export async function cancelLessonBooking(bookingId: string, memberId: string) {
  const { error } = await createSupabaseAdminClient().rpc("cancel_lesson_booking", { p_booking_id: bookingId, p_member_id: memberId, p_cutoff_hours: 12 });
  if (error) throw new Error(error.message);
  revalidatePath("/lessons"); revalidatePath("/memberships");
}
