import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentMemberByAuthUserId } from "@/lib/services/member-service";

export async function requireApprovedAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const member = await getCurrentMemberByAuthUserId(user.id);

  if (!member || member.role !== "admin" || member.status !== "approved") {
    redirect("/");
  }

  return member;
}

export async function requireApprovedMember() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sessions");
  const member = await getCurrentMemberByAuthUserId(user.id);
  if (!member || member.status !== "approved") redirect("/");
  return member;
}

export async function requireCurrentMember() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  const member = await getCurrentMemberByAuthUserId(user.id);
  if (!member) redirect("/");
  return member;
}
