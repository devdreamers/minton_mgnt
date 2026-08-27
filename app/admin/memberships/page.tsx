import {
  issueMembershipAction
} from "./actions";
import { listMembershipProducts } from "@/lib/services/membership-service";
import { listMembers } from "@/lib/services/member-service";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  await requireApprovedAdmin();
  const [members, products] = await Promise.all([
    listMembers().catch(() => []),
    listMembershipProducts().catch(() => [])
  ]);

  return (
    <div className="stack">
      <section className="page-heading admin-heading">
        <span className="eyebrow">Issuance</span>
        <h1>회원권 발급</h1>
        <p>회원에게 정식·프로모션·복구 회원권을 발급합니다. 상품 등록은 상품 목록에서 관리합니다.</p>
      </section>
      <section className="card">
        <form className="form" action={issueMembershipAction} style={{ marginTop: 20 }}>
          <div className="grid cols-3">
            <div className="field">
              <label htmlFor="member-id">회원</label>
              <select id="member-id" name="member_id" defaultValue="">
                <option value="" disabled>
                  회원 선택
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="product-id">상품</label>
              <select id="product-id" name="product_id" defaultValue={products[0]?.id ?? ""}>
                <option value="">직접 입력</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="source-type">발급 유형</label>
              <select id="source-type" name="source_type" defaultValue="product">
                <option value="product">정식</option>
                <option value="promotion">프로모션</option>
                <option value="restore">복구</option>
              </select>
            </div>
          </div>
          <div className="grid cols-3">
            <div className="field">
              <label htmlFor="title">제목</label>
              <input id="title" name="title" placeholder="20회권 / 여름방학 보너스" />
            </div>
            <div className="field">
              <label htmlFor="total-count">차감 횟수</label>
              <input id="total-count" name="total_count" type="number" min={1} defaultValue={20} />
            </div>
            <div className="field">
              <label htmlFor="memo">메모</label>
              <input id="memo" name="memo" placeholder="사유, 이력 등" />
            </div>
          </div>
          <div className="grid cols-3">
            <div className="field">
              <label htmlFor="start-date">시작일</label>
              <input id="start-date" name="start_date" type="date" />
            </div>
            <div className="field">
              <label htmlFor="end-date">종료일</label>
              <input id="end-date" name="end_date" type="date" />
            </div>
            <div />
          </div>
          <button className="btn btn-primary" type="submit">
            발급 저장
          </button>
        </form>
      </section>
    </div>
  );
}
