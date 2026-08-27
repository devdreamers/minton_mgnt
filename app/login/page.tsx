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
  const [email, setEmail] = useState("");
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

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
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
        회원가입은 소셜 로그인으로만 진행합니다. 로그인 후 생성되는 회원 정보는
        관리자 승인 전까지 pending 상태로 남습니다.
      </p>

      <div className="stack" style={{ marginTop: 24 }}>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void handlePasswordLogin();
          }}
        >
          <label>
            이메일
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@minton.local"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            비밀번호
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="btn btn-primary" disabled={loadingProvider !== null} type="submit">
            {loadingProvider === "password" ? "로그인 중..." : "이메일로 로그인"}
          </button>
        </form>

        <div className="subtle" style={{ textAlign: "center" }}>또는 소셜 로그인</div>
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
