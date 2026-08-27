"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedMember } from "@/lib/auth/require-admin";
import { applyToSession, cancelApplication } from "@/lib/services/session-service";

export async function applySessionAction(formData: FormData) {
  const member = await requireApprovedMember();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) throw new Error("session_id is required");
  await applyToSession(sessionId, member.id);
  revalidatePath("/sessions");
}

export async function cancelApplicationAction(formData: FormData) {
  const member = await requireApprovedMember();
  const applicationId = String(formData.get("application_id") ?? "");
  if (!applicationId) throw new Error("application_id is required");
  await cancelApplication(applicationId, member.id);
  revalidatePath("/sessions");
}
