"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMembershipProduct,
  getMembershipProduct,
  issueMembership,
  updateMembershipProduct
} from "@/lib/services/membership-service";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";

function todayInKorea() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export async function createProductAction(formData: FormData) {
  await requireApprovedAdmin();
  const name = String(formData.get("name") ?? "");
  const totalCount = Number(formData.get("total_count") ?? 0);
  const validityDays = Number(formData.get("validity_days") ?? 0);

  if (!name || totalCount <= 0 || validityDays <= 0) {
    throw new Error("상품 정보가 올바르지 않습니다.");
  }

  await createMembershipProduct({
    name,
    total_count: totalCount,
    validity_days: validityDays,
    is_active: true
  });

  revalidatePath("/admin/products");
  redirect("/admin/products?result=product-created");
}

export async function updateProductAction(formData: FormData) {
  await requireApprovedAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const name = String(formData.get("name") ?? "");
  const totalCount = Number(formData.get("total_count") ?? 0);
  const validityDays = Number(formData.get("validity_days") ?? 0);
  const isActive = String(formData.get("is_active") ?? "true") === "true";

  if (!productId || !name || totalCount <= 0 || validityDays <= 0) {
    throw new Error("상품 수정 정보가 올바르지 않습니다.");
  }

  await updateMembershipProduct(productId, {
    name,
    total_count: totalCount,
    validity_days: validityDays,
    is_active: isActive
  });
  revalidatePath("/admin/products");
  redirect("/admin/products?result=product-updated");
}

export async function issueMembershipAction(formData: FormData) {
  const adminMember = await requireApprovedAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  const productId = String(formData.get("product_id") ?? "") || null;
  const sourceType = String(formData.get("source_type") ?? "product") as
    | "product"
    | "promotion"
    | "restore";
  let title = String(formData.get("title") ?? "");
  let totalCount = Number(formData.get("total_count") ?? 0);
  const startDate = String(formData.get("start_date") ?? "") || null;
  let endDate = String(formData.get("end_date") ?? "") || null;
  const memo = String(formData.get("memo") ?? "") || null;

  if (productId) {
    const product = await getMembershipProduct(productId);
    title = product.name;
    totalCount = product.total_count;
    const issuedDate = todayInKorea();
    endDate = addDays(issuedDate, product.validity_days);
    await issueMembership({
      member_id: memberId,
      product_id: product.id,
      source_type: sourceType,
      title,
      total_count: totalCount,
      start_date: issuedDate,
      end_date: endDate,
      created_by: adminMember.auth_user_id,
      memo
    });
    revalidatePath("/admin/memberships");
    revalidatePath("/memberships");
    redirect("/admin/memberships?result=membership-issued");
    return;
  }

  if (!memberId || !title || totalCount <= 0) {
    throw new Error("발급 정보가 올바르지 않습니다.");
  }

  await issueMembership({
    member_id: memberId,
    product_id: productId,
    source_type: sourceType,
    title,
    total_count: totalCount,
    start_date: startDate,
    end_date: endDate,
    created_by: adminMember.auth_user_id,
    memo
  });

  revalidatePath("/admin/memberships");
  revalidatePath("/memberships");
  redirect("/admin/memberships?result=membership-issued");
}
