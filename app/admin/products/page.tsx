import { createProductAction, updateProductAction } from "../memberships/actions";
import { listMembershipProducts } from "@/lib/services/membership-service";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { SaveAlert } from "@/app/components/save-alert";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  await requireApprovedAdmin();
  const products = await listMembershipProducts().catch(() => []);
  const result = (await searchParams).result;

  return (
    <div className="stack">
      <SaveAlert message={result ? "저장했습니다." : null} />
      <section className="page-heading admin-heading">
        <span className="eyebrow">Products</span>
        <h1>상품 목록</h1>
        <p>회원권 발급에 사용할 횟수와 유효기간을 관리합니다.</p>
      </section>
      <section className="card">
        <h2>새 상품 등록</h2>
        <form className="form" action={createProductAction} style={{ marginTop: 20 }}>
          <div className="grid cols-3">
            <div className="field"><label htmlFor="product-name">상품명</label><input id="product-name" name="name" placeholder="20회권" required /></div>
            <div className="field"><label htmlFor="product-count">총 횟수</label><input id="product-count" name="total_count" type="number" min={1} defaultValue={20} required /></div>
            <div className="field"><label htmlFor="product-validity">유효일수</label><input id="product-validity" name="validity_days" type="number" min={1} defaultValue={90} required /></div>
          </div>
          <button className="btn btn-primary" type="submit">상품 저장</button>
        </form>
      </section>
      <section className="card">
        <div className="section-label"><h2>등록된 상품</h2><span className="subtle">{products.length}개</span></div>
        <div className="product-list">
          {products.length === 0 ? <p className="subtle">등록된 상품이 없습니다.</p> : products.map((product) => (
            <form className="product-row" action={updateProductAction} key={product.id}>
              <input name="product_id" type="hidden" value={product.id} />
              <div className="field"><label>상품명</label><input name="name" defaultValue={product.name} required /></div>
              <div className="field"><label>총 횟수</label><input name="total_count" defaultValue={product.total_count} type="number" min={1} required /></div>
              <div className="field"><label>유효일수</label><input name="validity_days" defaultValue={product.validity_days} type="number" min={1} required /></div>
              <div className="field"><label>상태</label><select name="is_active" defaultValue={String(product.is_active)}><option value="true">사용</option><option value="false">중지</option></select></div>
              <button className="btn" type="submit">저장</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
