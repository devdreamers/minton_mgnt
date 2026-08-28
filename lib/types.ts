export type MemberRole = "member" | "admin";
export type MemberStatus = "pending" | "approved" | "rejected" | "suspended";
export type AuthProvider = "google" | "kakao";
export const MEMBER_SKILL_LEVELS = ["미정", "초급", "D급", "C급", "B급", "A급", "S급"] as const;
export type MemberSkillLevel = (typeof MEMBER_SKILL_LEVELS)[number];

export type Member = {
  id: string;
  auth_user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  provider: AuthProvider | null;
  skill_level: string;
  role: MemberRole;
  status: MemberStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

export type MembershipProduct = {
  id: string;
  name: string;
  total_count: number;
  validity_days: number;
  is_active: boolean;
  created_at: string;
};

export type Membership = {
  id: string;
  member_id: string;
  product_id: string | null;
  source_type: "product" | "promotion" | "restore";
  title: string;
  total_count: number;
  remaining_count: number;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "expired" | "used_up" | "canceled";
  restored_from_id: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MembershipLog = {
  id: string;
  membership_id: string;
  change_type: "issue" | "use" | "expire" | "restore" | "cancel";
  change_amount: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

export type SessionTemplate = {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  application_open_time: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

export type SessionInstance = {
  id: string;
  template_id: string;
  session_date: string;
  start_at: string;
  end_at: string;
  capacity: number;
  application_open_at: string;
  status: "scheduled" | "canceled";
  created_at: string;
};

export type SessionApplication = {
  id: string;
  session_id: string;
  member_id: string;
  status: "confirmed" | "waitlisted" | "canceled";
  waitlist_position: number | null;
  applied_at: string;
  updated_at: string;
  created_at: string;
};
