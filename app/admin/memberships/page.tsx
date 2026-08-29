import { listMembershipProducts } from "@/lib/services/membership-service";
import { listMembers } from "@/lib/services/member-service";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { MembershipIssueForm } from "./membership-issue-form";
import { SaveAlert } from "@/app/components/save-alert";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  await requireApprovedAdmin();
  const [members, products] = await Promise.all([
    listMembers().catch(() => []),
    listMembershipProducts().catch(() => [])
  ]);
  const result = (await searchParams).result;

  return (
    <div className="stack">
      <SaveAlert message={result ? "저장했습니다." : null} />
      <section className="page-heading admin-heading">
        <span className="eyebrow">Issuance</span>
        <h1>회원권 발급</h1>
        <p>회원에게 정식·프로모션·복구 회원권을 발급합니다. 상품 등록은 상품 목록에서 관리합니다.</p>
      </section>
      <section className="card"><MembershipIssueForm members={members} products={products} /></section>
    </div>
  );
}
