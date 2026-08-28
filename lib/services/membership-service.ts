import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Membership, MembershipProduct } from "@/lib/types";

export async function listMembershipProducts() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("membership_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as MembershipProduct[];
}

export async function getMembershipProduct(productId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("membership_products")
    .select("*")
    .eq("id", productId)
    .single();
  if (error) throw new Error(error.message);
  return data as MembershipProduct;
}

export async function listMembershipsForMember(memberId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Membership[];
}

export async function createMembershipProduct(input: {
  name: string;
  total_count: number;
  validity_days: number;
  is_active?: boolean;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("membership_products")
    .insert({
      ...input,
      is_active: input.is_active ?? true
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/memberships");
  return data as MembershipProduct;
}

export async function updateMembershipProduct(
  productId: string,
  input: Partial<Pick<MembershipProduct, "name" | "total_count" | "validity_days" | "is_active">>
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("membership_products")
    .update(input)
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/memberships");
  return data as MembershipProduct;
}

export async function issueMembership(input: {
  member_id: string;
  product_id: string | null;
  source_type: "product" | "promotion" | "restore";
  title: string;
  total_count: number;
  start_date: string | null;
  end_date: string | null;
  created_by?: string | null;
  memo?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("memberships")
    .insert({
      ...input,
      remaining_count: input.total_count,
      status: "active",
      restored_from_id: null,
      created_by: input.created_by ?? null,
      memo: input.memo ?? null
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/memberships");
  revalidatePath("/memberships");
  return data as Membership;
}

export async function consumeMembership(memberId: string, reason: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("consume_membership", {
    p_member_id: memberId,
    p_reason: reason
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}
