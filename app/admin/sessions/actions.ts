"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { cancelSession, createSessionInstance, createSessionTemplate } from "@/lib/services/session-service";

const koreaDateTime = (value: string) => new Date(`${value}:00+09:00`).toISOString();

export async function createTemplateAction(formData: FormData) {
  const admin = await requireApprovedAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const day = Number(formData.get("day_of_week"));
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  const open = String(formData.get("application_open_time") ?? "");
  const capacity = Number(formData.get("capacity"));
  if (!title || !Number.isInteger(day) || day < 0 || day > 6 || !start || !end || !open || capacity < 1 || end <= start) throw new Error("소모임 템플릿 정보가 올바르지 않습니다.");
  await createSessionTemplate({ title, day_of_week: day, start_time: start, end_time: end, application_open_time: open, capacity, is_active: true, created_by: admin.auth_user_id });
  revalidatePath("/admin/sessions");
}

export async function createInstanceAction(formData: FormData) {
  await requireApprovedAdmin();
  const templateId = String(formData.get("template_id") ?? "");
  const date = String(formData.get("session_date") ?? "");
  const start = String(formData.get("start_at") ?? "");
  const end = String(formData.get("end_at") ?? "");
  const open = String(formData.get("application_open_at") ?? "");
  const capacity = Number(formData.get("capacity"));
  if (!templateId || !date || !start || !end || !open || capacity < 1) throw new Error("소모임 회차 정보가 올바르지 않습니다.");
  await createSessionInstance({ template_id: templateId, session_date: date, start_at: koreaDateTime(start), end_at: koreaDateTime(end), application_open_at: koreaDateTime(open), capacity });
  revalidatePath("/admin/sessions"); revalidatePath("/sessions");
}

export async function cancelSessionAction(formData: FormData) {
  await requireApprovedAdmin();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) throw new Error("session_id is required");
  await cancelSession(sessionId);
}
