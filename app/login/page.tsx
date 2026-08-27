"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type OAuthProvider = "google" | "kakao";

const providers = [
  { id: "google", label: "Google로 로그인", description: "Supabase 기본 OAuth" },
  { id: "kakao", label: "Kakao로 로그인", description: "Custom OIDC Provider" }
];

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: string) => {
    setLoadingProvider(provider);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: provider as OAuthProvider,
      options: {
        redirectTo:
          typeof window === "undefined"
            ? undefined
            : `${window.location.origin}/auth/callback`
      }
    });

    if (signInError) {
      setError(signInError.message);
      setLoadingProvider(null);
      return;
    }
  };

  const handlePasswordLogin = async () => {
    setLoadingProvider("password");
    setError(null);

    if (adminId !== "admin") {
      setError("관리자 아이디는 admin입니다.");
      setLoadingProvider(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: "admin@minton.local",
      password
    });

    if (signInError) {
      setError(signInError.message);
      setLoadingProvider(null);
      return;
    }

    window.location.href = "/";
  };

  return (
    <section className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <span className="eyebrow">Authentication</span>
      <h1 style={{ marginTop: 12 }}>관리자 승인 후 이용합니다.</h1>
      <p className="muted">
        관리자는 아이디와 비밀번호로 로그인합니다. 일반 회원은 회원가입 없이
        소셜 로그인으로 이용할 수 있습니다.
      </p>

      <div className="stack" style={{ marginTop: 24 }}>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void handlePasswordLogin();
          }}
        >
          <div className="field">
            <label htmlFor="admin-id">관리자 아이디</label>
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
          <button className="btn btn-primary" disabled={loadingProvider !== null} type="submit">
            {loadingProvider === "password" ? "로그인 중..." : "관리자 로그인"}
          </button>
        </form>

        <div className="subtle" style={{ textAlign: "center" }}>일반 회원 소셜 로그인</div>
        {providers.map((provider) => (
          <button
            key={provider.id}
            className="btn"
            disabled={loadingProvider !== null}
            onClick={() => handleLogin(provider.id)}
            type="button"
          >
            {loadingProvider === provider.id ? "연결 중..." : provider.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="notice danger" style={{ marginTop: 18 }}>
          {error}
        </div>
      ) : null}

      <p className="subtle" style={{ marginTop: 18 }}>
        Kakao는 Supabase에서 Custom OIDC로 연결되도록 환경 설정이 필요합니다.
      </p>
    </section>
  );
}
