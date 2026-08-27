"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (adminId !== "admin") {
      setError("관리자 아이디는 admin입니다.");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: "admin@minton.local",
      password
    });

    if (signInError) {
      setError("아이디 또는 비밀번호를 확인해 주세요.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <section className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <span className="eyebrow">Admin only</span>
      <h1 style={{ marginTop: 12 }}>관리자 로그인</h1>
      <p className="muted">관리자 계정으로 로그인해 운영 화면에 접근합니다.</p>

      <form className="stack" onSubmit={handleLogin} style={{ marginTop: 24 }}>
        <div className="field">
          <label htmlFor="admin-id">아이디</label>
          <input
            autoComplete="username"
            id="admin-id"
            onChange={(event) => setAdminId(event.target.value)}
            placeholder="admin"
            required
            type="text"
            value={adminId}
          />
        </div>
        <div className="field">
          <label htmlFor="admin-password">비밀번호</label>
          <input
            autoComplete="current-password"
            id="admin-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "로그인 중..." : "관리자 로그인"}
        </button>
      </form>

      {error ? <div className="notice danger" style={{ marginTop: 18 }}>{error}</div> : null}
    </section>
  );
}
