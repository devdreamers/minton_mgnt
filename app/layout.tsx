import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/supabase/server";
import { logoutAction } from "@/app/logout/actions";
import { getCurrentMemberByAuthUserId } from "@/lib/services/member-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "에이원민턴",
  description: "No.1 배드민턴 센터"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const member = user ? await getCurrentMemberByAuthUserId(user.id) : null;
  const isAdmin = member?.role === "admin" && member.status === "approved";
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">A1</span>
              <span>
                <strong>A1</strong> minton
              </span>
            </Link>
            <nav className="nav">
              {user ? (
                <>
                  <details className="nav-menu">
                    <summary>내 공간</summary>
                    <div className="nav-menu-panel">
                      <Link href="/profile">내 정보</Link>
                      <Link href="/memberships">내 회원권</Link>
                      <Link href="/sessions">소모임</Link>
                      <span className="nav-menu-future">레슨 예약 · 준비 중</span>
                    </div>
                  </details>
                  {isAdmin ? <Link className="nav-admin" href="/admin">관리자 화면</Link> : null}
                  <form action={logoutAction}>
                    <button className="nav-button" type="submit">로그아웃</button>
                  </form>
                </>
              ) : <Link href="/login">로그인</Link>}
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
