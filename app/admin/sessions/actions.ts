"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { cancelSession, createSessionInstance, createSessionTemplate, getSessionTemplate, updateSessionTemplate } from "@/lib/services/session-service";

const koreaDateTimeForDate = (date: string, time: string) => new Date(`${date}T${time.slice(0, 5)}:00+09:00`).toISOString();
const isDuplicateTemplateError = (error: unknown) => error instanceof Error && error.message.includes("session template already exists");

export async function createTemplateAction(formData: FormData) {
  const admin = await requireApprovedAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const day = Number(formData.get("day_of_week"));
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  const open = String(formData.get("application_open_time") ?? "");
  const capacity = Number(formData.get("capacity"));
  if (!title || !Number.isInteger(day) || day < 0 || day > 6 || !start || !end || !open || capacity < 1 || end <= start) throw new Error("소모임 템플릿 정보가 올바르지 않습니다.");
  try {
    await createSessionTemplate({ title, day_of_week: day, start_time: start, end_time: end, application_open_time: open, capacity, is_active: true, created_by: admin.auth_user_id });
  } catch (error) {
    if (isDuplicateTemplateError(error)) redirect("/admin/sessions?error=template-duplicate");
    throw error;
  }
  revalidatePath("/admin/sessions");
  redirect("/admin/sessions?result=template-created");
}

export async function updateTemplateAction(formData: FormData) {
  await requireApprovedAdmin();
  const templateId = String(formData.get("template_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const day = Number(formData.get("day_of_week"));
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  const open = String(formData.get("application_open_time") ?? "");
  const capacity = Number(formData.get("capacity"));
  if (!templateId || !title || !Number.isInteger(day) || day < 0 || day > 6 || !start || !end || !open || capacity < 1 || end <= start) throw new Error("소모임 템플릿 정보가 올바르지 않습니다.");
  try {
    await updateSessionTemplate(templateId, { title, day_of_week: day, start_time: start, end_time: end, application_open_time: open, capacity, is_active: true });
  } catch (error) {
    if (isDuplicateTemplateError(error)) redirect("/admin/sessions?error=template-duplicate");
    throw error;
  }
  redirect("/admin/sessions?result=template-updated");
}

export async function createInstanceAction(formData: FormData) {
  await requireApprovedAdmin();
  const templateId = String(formData.get("template_id") ?? "");
  const date = String(formData.get("session_date") ?? "");
  if (!templateId || !date) throw new Error("소모임 템플릿과 날짜를 선택해주세요.");
  try {
    const template = await getSessionTemplate(templateId);
    const selectedDay = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (selectedDay !== template.day_of_week) throw new Error("템플릿의 요일과 회차 날짜가 일치하지 않습니다.");
    await createSessionInstance({
      template_id: template.id,
      session_date: date,
      start_at: koreaDateTimeForDate(date, template.start_time),
      end_at: koreaDateTimeForDate(date, template.end_time),
      application_open_at: koreaDateTimeForDate(date, template.application_open_time),
      capacity: template.capacity
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "회차 생성에 실패했습니다.";
    redirect(`/admin/sessions?error=${message.includes("요일") ? "wrong-day" : message.includes("already exists") || message.includes("duplicate") || message.includes("unique") ? "duplicate" : "create-failed"}`);
  }
  revalidatePath("/admin/sessions"); revalidatePath("/sessions");
  redirect("/admin/sessions?result=instance-created");
}

export async function cancelSessionAction(formData: FormData) {
  await requireApprovedAdmin();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) throw new Error("session_id is required");
  await cancelSession(sessionId);
  revalidatePath("/admin/sessions"); revalidatePath("/sessions");
  redirect("/admin/sessions?result=session-canceled");
}
