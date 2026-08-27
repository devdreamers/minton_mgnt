"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth/require-admin";
import { updateMemberProfile } from "@/lib/services/member-service";

export async function updateProfileAction(
  _previousState: { error: string; success: boolean },
  formData: FormData
) {
  const member = await requireCurrentMember();
  const name = String(formData.get("name") ?? "").trim();
  const phoneValue = String(formData.get("phone") ?? "").trim();
  try {
    if (!name || name.length > 50) throw new Error("이름을 확인해주세요.");
    if (phoneValue.length > 30) throw new Error("전화번호를 확인해주세요.");
    await updateMemberProfile(member.id, { name, phone: phoneValue || null });
    revalidatePath("/profile");
    return { error: "", success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "저장에 실패했습니다.", success: false };
  }
}
