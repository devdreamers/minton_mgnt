"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveMember, rejectMember, updateMemberSkillLevel } from "@/lib/services/member-service";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";

export async function approveMemberAction(formData: FormData) {
  const adminMember = await requireApprovedAdmin();
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) {
    throw new Error("memberId is required");
  }

  if (!adminMember.auth_user_id) {
    throw new Error("approved admin user is missing auth_user_id");
  }

  await approveMember(memberId, adminMember.auth_user_id);
  revalidatePath("/admin/members");
  redirect("/admin/members?result=approved");
}

export async function rejectMemberAction(formData: FormData) {
  await requireApprovedAdmin();
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) {
    throw new Error("memberId is required");
  }

  await rejectMember(memberId);
  revalidatePath("/admin/members");
  redirect("/admin/members?result=rejected");
}

export async function updateMemberSkillLevelAction(formData: FormData) {
  await requireApprovedAdmin();
  const memberId = String(formData.get("memberId") ?? "");
  const skillLevel = String(formData.get("skillLevel") ?? "");
  if (!memberId || !skillLevel) throw new Error("회원 급수 정보가 올바르지 않습니다.");
  await updateMemberSkillLevel(memberId, skillLevel);
  redirect("/admin/members?result=level-updated");
}
