"use client";

import { useActionState } from "react";
import { updateProfileAction } from "./actions";

const initialState: { error: string; success: boolean } = { error: "", success: false };

export function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  return (
    <form className="form" action={action} style={{ marginTop: 28 }}>
      <div className="field">
        <label htmlFor="profile-name">이름</label>
        <input id="profile-name" name="name" defaultValue={name} maxLength={50} required />
      </div>
      <div className="field">
        <label htmlFor="profile-phone">전화번호</label>
        <input id="profile-phone" name="phone" type="tel" defaultValue={phone ?? ""} maxLength={30} placeholder="010-0000-0000" />
      </div>
      {state.error ? <div className="notice danger">{state.error}</div> : null}
      {state.success ? <div className="notice">저장되었습니다.</div> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "저장 중..." : "저장하기"}</button>
    </form>
  );
}
