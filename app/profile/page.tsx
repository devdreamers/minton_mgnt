import { requireCurrentMember } from "@/lib/auth/require-admin";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const member = await requireCurrentMember();
  return (
    <section className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <span className="eyebrow">My profile</span>
      <h1 style={{ marginTop: 12 }}>내 정보</h1>
      <p className="muted">센터 이용에 필요한 이름과 전화번호를 관리합니다.</p>

      <ProfileForm name={member.name} phone={member.phone} />

      <p className="subtle" style={{ marginTop: 20 }}>
        배드민턴 급수: <strong>{member.skill_level}</strong><br />
        가입 상태: {member.status === "approved" ? "승인됨" : member.status === "pending" ? "승인 대기" : member.status}
      </p>
    </section>
  );
}
