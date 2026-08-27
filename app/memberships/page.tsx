import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCurrentMemberByAuthUserId } from "@/lib/services/member-service";
import { listMembershipsForMember } from "@/lib/services/membership-service";

export const dynamic = "force-dynamic";

export default async function MyMembershipsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <section className="card">
        <span className="eyebrow">My membership</span>
        <h1 style={{ marginTop: 12 }}>로그인이 필요합니다.</h1>
        <p className="muted">본인 회원권 조회는 인증 후 확인할 수 있습니다.</p>
        <Link className="btn btn-primary" href="/login">
          로그인 페이지로 이동
        </Link>
      </section>
    );
  }

  const member = await getCurrentMemberByAuthUserId(user.id);

  if (!member) {
    return (
      <section className="card">
        <h1>회원 프로필이 아직 생성되지 않았습니다.</h1>
        <p className="muted">
          auth user는 존재하지만 members row가 아직 없습니다. on_auth_user_created
          트리거를 확인해야 합니다.
        </p>
      </section>
    );
  }

  const memberships = await listMembershipsForMember(member.id).catch(() => []);

  return (
    <section className="card">
      <span className="eyebrow">My membership</span>
      <h1 style={{ marginTop: 12 }}>{member.name}님의 회원권</h1>
      <p className="muted">
        승인 상태: {member.status} / 역할: {member.role}
      </p>

      <div style={{ overflowX: "auto", marginTop: 24 }}>
        <table className="table">
          <thead>
            <tr>
              <th>제목</th>
              <th>잔여</th>
              <th>기간</th>
              <th>출처</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={5} className="subtle">
                  아직 발급된 회원권이 없습니다.
                </td>
              </tr>
            ) : (
              memberships.map((membership) => (
                <tr key={membership.id}>
                  <td>{membership.title}</td>
                  <td>
                    {membership.remaining_count}/{membership.total_count}
                  </td>
                  <td>
                    {membership.start_date ?? "-"} ~ {membership.end_date ?? "-"}
                  </td>
                  <td>{membership.source_type}</td>
                  <td>{membership.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
