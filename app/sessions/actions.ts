"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedMember } from "@/lib/auth/require-admin";
import { applyToSession, cancelApplication } from "@/lib/services/session-service";

export async function applySessionAction(formData: FormData) {
  const member = await requireApprovedMember();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) throw new Error("session_id is required");
  try {
    await applyToSession(sessionId, member.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "신청에 실패했습니다.";
    const errorCode = message === "application is not open" ? "not-open"
      : message === "session has started" ? "started"
      : message === "member already applied" ? "already-applied"
      : "failed";
    redirect(`/sessions?error=${errorCode}`);
  }
  revalidatePath("/sessions");
}

export async function cancelApplicationAction(formData: FormData) {
  const member = await requireApprovedMember();
  const applicationId = String(formData.get("application_id") ?? "");
  if (!applicationId) throw new Error("application_id is required");
  await cancelApplication(applicationId, member.id);
  revalidatePath("/sessions");
}
