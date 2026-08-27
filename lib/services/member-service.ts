import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Member } from "@/lib/types";

export async function listMembers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Member[];
}

export async function approveMember(memberId: string, approvedBy: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("members")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    })
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/members");
  return data as Member;
}

export async function rejectMember(memberId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("members")
    .update({ status: "rejected" })
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/members");
  return data as Member;
}

export async function getCurrentMemberByAuthUserId(authUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) {
    return null;
  }

  return data as Member;
}

export async function updateMemberProfile(memberId: string, input: { name: string; phone: string | null }) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("members")
    .update({ name: input.name, phone: input.phone })
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  return data as Member;
}
