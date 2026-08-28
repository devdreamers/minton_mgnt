import { approveMemberAction, rejectMemberAction, updateMemberSkillLevelAction } from "./actions";
import { listMembers } from "@/lib/services/member-service";
import { requireApprovedAdmin } from "@/lib/auth/require-admin";
import { MEMBER_SKILL_LEVELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({
  searchParams
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  await requireApprovedAdmin();
  const members = await listMembers().catch(() => []);
  const result = (await searchParams).result;

  return (
    <section className="card">
      <span className="eyebrow">Members</span>
      <h1 style={{ marginTop: 12 }}>회원 목록</h1>
      <p className="muted">
        전체 회원 현황을 확인하고, 승인 대기 회원을 바로 처리할 수 있습니다.
      </p>

      {result === "approved" ? <div className="notice" style={{ marginTop: 20 }}>회원을 승인했습니다.</div> : null}
      {result === "rejected" ? <div className="notice" style={{ marginTop: 20 }}>가입을 거절했습니다.</div> : null}
      {result === "level-updated" ? <div className="notice" style={{ marginTop: 20 }}>회원 급수를 저장했습니다.</div> : null}

      <div style={{ overflowX: "auto", marginTop: 24 }}>
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>전화번호</th>
              <th>급수</th>
              <th>상태</th>
              <th>가입일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="subtle">
                  등록된 회원이 없습니다.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.name}</strong>
                  </td>
                  <td>{member.phone ?? "미입력"}</td>
                  <td>
                    <form className="inline-actions" action={updateMemberSkillLevelAction}>
                      <input name="memberId" type="hidden" value={member.id} />
                      <select name="skillLevel" defaultValue={member.skill_level || "미정"} aria-label={`${member.name} 급수`}>
                        {MEMBER_SKILL_LEVELS.map((level) => <option value={level} key={level}>{level}</option>)}
                      </select>
                      <button className="btn" type="submit">저장</button>
                    </form>
                  </td>
                  <td><span className={`status-badge status-${member.status}`}>{member.status === "approved" ? "승인" : member.status === "pending" ? "대기" : member.status === "rejected" ? "거절" : "중지"}</span></td>
                  <td>
                    {new Date(member.created_at).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul"
                    })}
                  </td>
                  <td>
                    <div className="inline-actions">
                      {member.status === "pending" ? <>
                        <form action={approveMemberAction}>
                          <input name="memberId" type="hidden" value={member.id} />
                          <button className="btn btn-primary" type="submit">승인</button>
                        </form>
                        <form action={rejectMemberAction}>
                          <input name="memberId" type="hidden" value={member.id} />
                          <button className="btn" type="submit">거절</button>
                        </form>
                      </> : <span className="subtle">처리 완료</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
