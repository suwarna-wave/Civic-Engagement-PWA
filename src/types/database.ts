export type UserRole = "super_admin" | "admin" | "user";
export type VoteTargetType = "post" | "poll";

export type Profile = {
  id: string;
  phone: string;
  role: UserRole;
  district: string | null;
  local_level: string | null;
  ward: number | null;
  admin_scope: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  display_author_id: string | null;
  district: string;
  local_level: string;
  ward: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Poll = {
  id: string;
  admin_id: string;
  question: string;
  options: string[];
  district: string;
  local_level: string | null;
  ward: number | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Vote = {
  id: string;
  user_id: string;
  target_type: VoteTargetType;
  target_id: string;
  vote_value: number;
  created_at: string;
  updated_at: string;
};

export type FeedPost = Post & {
  my_vote?: -1 | 1 | null;
};
