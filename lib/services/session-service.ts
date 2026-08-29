import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SessionApplication, SessionInstance, SessionTemplate } from "@/lib/types";

export async function listSessionTemplates() {
  const { data, error } = await createSupabaseAdminClient().from("session_templates").select("*").order("day_of_week").order("start_time");
  if (error) throw new Error(error.message);
  return data as SessionTemplate[];
}

export async function getSessionTemplate(templateId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("session_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (error) throw new Error(error.message);
  return data as SessionTemplate;
}

export async function listUpcomingSessions(from = new Date().toISOString().slice(0, 10), includeCanceled = false) {
  let query = createSupabaseAdminClient().from("session_instances").select("*, session_templates(title)").gte("session_date", from).order("session_date").order("start_at");
  if (!includeCanceled) query = query.eq("status", "scheduled");
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as (SessionInstance & { session_templates: { title: string } | null })[];
}

export async function listConfirmedApplicationCounts(sessionIds: string[]) {
  const counts = new Map<string, number>();
  if (sessionIds.length === 0) return counts;

  const { data, error } = await createSupabaseAdminClient()
    .from("session_applications")
    .select("session_id")
    .in("session_id", sessionIds)
    .eq("status", "confirmed");
  if (error) throw new Error(error.message);

  for (const application of data ?? []) {
    counts.set(application.session_id, (counts.get(application.session_id) ?? 0) + 1);
  }
  return counts;
}

export async function listApplicationsForSession(sessionId: string) {
  const { data, error } = await createSupabaseAdminClient().from("session_applications").select("*, members(name, email)").eq("session_id", sessionId).in("status", ["confirmed", "waitlisted"]).order("status").order("waitlist_position").order("applied_at");
  if (error) throw new Error(error.message);
  return data as (SessionApplication & { members: { name: string; email: string | null } | null })[];
}

export async function listMyApplications(memberId: string) {
  const { data, error } = await createSupabaseAdminClient().from("session_applications").select("*, session_instances(*, session_templates(title))").eq("member_id", memberId).in("status", ["confirmed", "waitlisted"]).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as (SessionApplication & { session_instances: (SessionInstance & { session_templates: { title: string } | null }) | null })[])
    .filter((application) => application.session_instances?.status === "scheduled");
}

export async function createSessionTemplate(input: Omit<SessionTemplate, "id" | "created_at">) {
  const { data, error } = await createSupabaseAdminClient().from("session_templates").insert(input).select().single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sessions");
  return data as SessionTemplate;
}

export async function updateSessionTemplate(templateId: string, input: Partial<Omit<SessionTemplate, "id" | "created_at" | "created_by">>) {
  const { data, error } = await createSupabaseAdminClient()
    .from("session_templates")
    .update(input)
    .eq("id", templateId)
    .select()
    .single();
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
  const { error } = await createSupabaseAdminClient()
    .from("session_instances")
    .update({ status: "canceled" })
    .eq("id", sessionId)
    .eq("status", "scheduled");
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
