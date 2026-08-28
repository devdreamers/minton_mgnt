"use client";

import { useMemo, useState } from "react";
import type { Member, MembershipProduct } from "@/lib/types";
import { issueMembershipAction } from "./actions";

function addDays(date: string, days: number) {
  if (!date) return "";
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function MembershipIssueForm({ members, products }: { members: Member[]; products: MembershipProduct[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [title, setTitle] = useState(products[0]?.name ?? "");
  const [totalCount, setTotalCount] = useState(String(products[0]?.total_count ?? ""));
  const selectedProduct = useMemo(() => products.find((product) => product.id === productId), [productId, products]);

  const handleProductChange = (nextProductId: string) => {
    const product = products.find((item) => item.id === nextProductId);
    setProductId(nextProductId);
    setTitle(product?.name ?? "");
    setTotalCount(product ? String(product.total_count) : "");
  };

  return (
    <form className="form" action={issueMembershipAction} style={{ marginTop: 20 }}>
      <div className="grid cols-3">
        <div className="field">
          <label htmlFor="member-id">회원</label>
          <select id="member-id" name="member_id" defaultValue="" required>
            <option value="" disabled>회원 선택</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.status})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="product-id">상품</label>
          <select id="product-id" name="product_id" value={productId} onChange={(event) => handleProductChange(event.target.value)}>
            <option value="">직접 입력 (프로모션/복구)</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.total_count}회 · {product.validity_days}일</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="source-type">발급 유형</label>
          <select id="source-type" name="source_type" defaultValue="product">
            <option value="product">정식</option><option value="promotion">프로모션</option><option value="restore">복구</option>
          </select>
        </div>
      </div>
      <div className="grid cols-3">
        <div className="field"><label htmlFor="title">회원권명</label><input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} readOnly={Boolean(selectedProduct)} placeholder="여름방학 보너스" required /></div>
        <div className="field"><label htmlFor="total-count">차감 횟수</label><input id="total-count" name="total_count" type="number" min={1} value={totalCount} onChange={(event) => setTotalCount(event.target.value)} readOnly={Boolean(selectedProduct)} required /></div>
        <div className="field"><label>상품 유효기간</label><div className="notice">{selectedProduct ? `${selectedProduct.validity_days}일 · 상품에서 자동 적용` : "직접 입력"}</div></div>
      </div>
      <div className="grid cols-3">
        <div className="field"><label htmlFor="start-date">시작일</label><input id="start-date" name="start_date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required={Boolean(selectedProduct)} /></div>
        <div className="field"><label htmlFor="end-date">종료일</label><input id="end-date" name="end_date" type="date" value={selectedProduct ? addDays(startDate, selectedProduct.validity_days) : ""} readOnly={Boolean(selectedProduct)} /></div>
        <div className="field"><label htmlFor="memo">메모</label><input id="memo" name="memo" placeholder="사유, 이력 등" /></div>
      </div>
      <button className="btn btn-primary" type="submit">상품정보로 발급</button>
    </form>
  );
}
