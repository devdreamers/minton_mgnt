import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SessionApplication, SessionInstance, SessionTemplate } from "@/lib/types";

export async function listSessionTemplates() {
  const { data, error } = await createSupabaseAdminClient().from("session_templates").select("*").order("day_of_week").order("start_time");
  if (error) throw new Error(error.message);
  return data as SessionTemplate[];
}

export async function listUpcomingSessions(from = new Date().toISOString().slice(0, 10)) {
  const { data, error } = await createSupabaseAdminClient().from("session_instances").select("*, session_templates(title)").gte("session_date", from).order("session_date").order("start_at");
  if (error) throw new Error(error.message);
  return data as (SessionInstance & { session_templates: { title: string } | null })[];
}

export async function listApplicationsForSession(sessionId: string) {
  const { data, error } = await createSupabaseAdminClient().from("session_applications").select("*, members(name, email)").eq("session_id", sessionId).in("status", ["confirmed", "waitlisted"]).order("status").order("waitlist_position").order("applied_at");
  if (error) throw new Error(error.message);
  return data as (SessionApplication & { members: { name: string; email: string | null } | null })[];
}

export async function listMyApplications(memberId: string) {
  const { data, error } = await createSupabaseAdminClient().from("session_applications").select("*, session_instances(*, session_templates(title))").eq("member_id", memberId).in("status", ["confirmed", "waitlisted"]).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as (SessionApplication & { session_instances: SessionInstance & { session_templates: { title: string } | null } })[];
}

export async function createSessionTemplate(input: Omit<SessionTemplate, "id" | "created_at">) {
  const { data, error } = await createSupabaseAdminClient().from("session_templates").insert(input).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sessions");
  return data as SessionTemplate;
}

export async function createSessionInstance(input: Omit<SessionInstance, "id" | "created_at" | "status">) {
  const { data, error } = await createSupabaseAdminClient().from("session_instances").insert({ ...input, status: "scheduled" }).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sessions"); revalidatePath("/sessions");
  return data as SessionInstance;
}

export async function cancelSession(sessionId: string) {
  const { error } = await createSupabaseAdminClient().from("session_instances").update({ status: "canceled" }).eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sessions"); revalidatePath("/sessions");
}

export async function applyToSession(sessionId: string, memberId: string) {
  const { data, error } = await createSupabaseAdminClient().rpc("apply_session", { p_session_id: sessionId, p_member_id: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/sessions");
  return data as "confirmed" | "waitlisted";
}

export async function cancelApplication(applicationId: string, memberId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: application, error: lookupError } = await supabase.from("session_applications").select("id").eq("id", applicationId).eq("member_id", memberId).maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (!application) throw new Error("신청을 찾을 수 없습니다.");
  const { error } = await supabase.rpc("cancel_session_application", { p_application_id: applicationId });
  if (error) throw new Error(error.message);
  revalidatePath("/sessions"); revalidatePath("/admin/sessions");
}
