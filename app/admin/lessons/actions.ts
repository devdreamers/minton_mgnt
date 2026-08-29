"use server";

import { redirect } from "next/navigation";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { createLessonCourt, createLessonSchedule, generateLessonSlots } from "@/lib/services/lesson-service";

export async function createCourtAction(formData: FormData) {
  await requireApprovedAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("코트 이름을 입력해주세요.");
  try { await createLessonCourt(name); } catch { redirect("/admin/lessons?error=duplicate-court"); }
  redirect("/admin/lessons?result=court-created");
}

export async function createScheduleAction(formData: FormData) {
  const admin = await requireApprovedAdmin();
  const courtId = String(formData.get("court_id") ?? "");
  const day = Number(formData.get("day_of_week"));
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  const interval = Number(formData.get("slot_interval_minutes"));
  if (!courtId || !Number.isInteger(day) || day < 0 || day > 6 || !start || !end || end <= start || !Number.isInteger(interval) || interval < 1) throw new Error("운영시간 정보를 확인해주세요.");
  try { await createLessonSchedule({ court_id: courtId, day_of_week: day, start_time: start, end_time: end, slot_interval_minutes: interval, created_by: admin.auth_user_id }); }
  catch { redirect("/admin/lessons?error=duplicate-schedule"); }
  redirect("/admin/lessons?result=schedule-created");
}

export async function generateSlotsAction(formData: FormData) {
  await requireApprovedAdmin();
  const from = String(formData.get("from_date") ?? ""); const to = String(formData.get("to_date") ?? "");
  if (!from || !to) throw new Error("슬롯 생성 날짜를 입력해주세요.");
  try { await generateLessonSlots(from, to); } catch { redirect("/admin/lessons?error=slot-generation"); }
  redirect("/admin/lessons?result=slots-generated");
}
