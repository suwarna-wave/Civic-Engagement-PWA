-- Swatantra Aawaj - Koshi
-- Online-First schema, RBAC helpers, and RLS
-- Roles for authorization live in public.users (NOT auth.users raw_user_meta_data)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS private;

CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'user');
CREATE TYPE public.vote_target_type AS ENUM ('post', 'poll');

-- ---------------------------------------------------------------------------
-- Profiles (public.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'user',
  district TEXT,
  local_level TEXT,
  ward INTEGER CHECK (ward IS NULL OR (ward >= 1 AND ward <= 50)),
  admin_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Geography may be null until onboarding; once any geo field is set, all three required.
  CONSTRAINT users_geo_complete_or_empty CHECK (
    role = 'super_admin'
    OR (
      (district IS NULL AND local_level IS NULL AND ward IS NULL)
      OR (district IS NOT NULL AND local_level IS NOT NULL AND ward IS NOT NULL)
    )
  )
);

CREATE INDEX users_district_idx ON public.users (district);
CREATE INDEX users_role_idx ON public.users (role);

-- ---------------------------------------------------------------------------
-- Posts (no direct author_id column — authorship isolated)
-- display_author_id is set only when is_anonymous = false
-- ---------------------------------------------------------------------------
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  display_author_id UUID REFERENCES public.users (id),
  district TEXT NOT NULL,
  local_level TEXT NOT NULL,
  ward INTEGER NOT NULL CHECK (ward >= 1 AND ward <= 50),
  upvotes INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
  downvotes INTEGER NOT NULL DEFAULT 0 CHECK (downvotes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT posts_anonymous_hides_display_author CHECK (
    (is_anonymous = true AND display_author_id IS NULL)
    OR (is_anonymous = false AND display_author_id IS NOT NULL)
  )
);

CREATE INDEX posts_region_idx ON public.posts (district, local_level, ward);
CREATE INDEX posts_created_at_idx ON public.posts (created_at DESC);
CREATE INDEX posts_score_idx ON public.posts ((upvotes - downvotes) DESC);

-- Backend-only authorship link (Super Admin / author)
CREATE TABLE public.post_authorship (
  post_id UUID PRIMARY KEY REFERENCES public.posts (id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX post_authorship_author_idx ON public.post_authorship (author_id);

-- ---------------------------------------------------------------------------
-- Polls & votes
-- ---------------------------------------------------------------------------
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users (id),
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 1 AND 500),
  options JSONB NOT NULL CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) BETWEEN 2 AND 10),
  district TEXT NOT NULL,
  local_level TEXT,
  ward INTEGER CHECK (ward IS NULL OR (ward >= 1 AND ward <= 50)),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX polls_region_idx ON public.polls (district, local_level, ward);

CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  target_type public.vote_target_type NOT NULL,
  target_id UUID NOT NULL,
  vote_value SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT votes_value_check CHECK (
    (target_type = 'post' AND vote_value IN (-1, 1))
    OR (target_type = 'poll' AND vote_value >= 0 AND vote_value <= 9)
  ),
  CONSTRAINT votes_one_per_user_target UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX votes_target_idx ON public.votes (target_type, target_id);

-- ---------------------------------------------------------------------------
-- OTP challenges (service_role only; no client grants)
-- ---------------------------------------------------------------------------
CREATE TABLE public.otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX otp_challenges_phone_created_idx ON public.otp_challenges (phone, created_at DESC);

CREATE TABLE public.otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX otp_rate_limits_phone_created_idx ON public.otp_rate_limits (phone, created_at DESC);

-- ---------------------------------------------------------------------------
-- Private RBAC helpers (not exposed via Data API)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.current_profile()
RETURNS public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION private.current_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_profile() TO authenticated;

CREATE OR REPLACE FUNCTION private.current_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION private.current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_role() TO authenticated;

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Admin jurisdiction: district match, optional local_level/ward narrowing via admin_scope
CREATE OR REPLACE FUNCTION private.admin_covers_region(
  p_district TEXT,
  p_local_level TEXT,
  p_ward INTEGER
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.district = p_district
      AND (
        COALESCE(u.admin_scope->>'local_level', u.local_level) IS NULL
        OR COALESCE(u.admin_scope->>'local_level', u.local_level) = p_local_level
      )
      AND (
        (u.admin_scope ? 'ward') = false
        OR (u.admin_scope->>'ward')::int = p_ward
      )
  );
$$;

REVOKE ALL ON FUNCTION private.admin_covers_region(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_covers_region(TEXT, TEXT, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION private.same_district(p_district TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.district = p_district
  );
$$;

REVOKE ALL ON FUNCTION private.same_district(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.same_district(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER polls_set_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER votes_set_updated_at
  BEFORE UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Vote counter maintenance for posts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.apply_post_vote_delta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_val SMALLINT;
  new_val SMALLINT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      IF NEW.vote_value = 1 THEN
        UPDATE public.posts SET upvotes = upvotes + 1 WHERE id = NEW.target_id AND deleted_at IS NULL;
      ELSE
        UPDATE public.posts SET downvotes = downvotes + 1 WHERE id = NEW.target_id AND deleted_at IS NULL;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.target_type = 'post' AND OLD.vote_value IS DISTINCT FROM NEW.vote_value THEN
      old_val := OLD.vote_value;
      new_val := NEW.vote_value;
      IF old_val = 1 THEN
        UPDATE public.posts SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = NEW.target_id;
      ELSIF old_val = -1 THEN
        UPDATE public.posts SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = NEW.target_id;
      END IF;
      IF new_val = 1 THEN
        UPDATE public.posts SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
      ELSIF new_val = -1 THEN
        UPDATE public.posts SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      IF OLD.vote_value = 1 THEN
        UPDATE public.posts SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.target_id;
      ELSE
        UPDATE public.posts SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.target_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER votes_apply_post_delta
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION private.apply_post_vote_delta();

-- ---------------------------------------------------------------------------
-- RPC: create post + authorship atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_idea_post(
  p_title TEXT,
  p_content TEXT,
  p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS public.posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile public.users;
  new_post public.posts;
BEGIN
  SELECT * INTO profile FROM public.users WHERE id = auth.uid();
  IF profile.id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF profile.district IS NULL OR profile.local_level IS NULL OR profile.ward IS NULL THEN
    RAISE EXCEPTION 'profile geography incomplete';
  END IF;

  INSERT INTO public.posts (
    title, content, is_anonymous, display_author_id,
    district, local_level, ward
  ) VALUES (
    trim(p_title),
    trim(p_content),
    COALESCE(p_is_anonymous, false),
    CASE WHEN COALESCE(p_is_anonymous, false) THEN NULL ELSE profile.id END,
    profile.district,
    profile.local_level,
    profile.ward
  )
  RETURNING * INTO new_post;

  INSERT INTO public.post_authorship (post_id, author_id)
  VALUES (new_post.id, profile.id);

  RETURN new_post;
END;
$$;

REVOKE ALL ON FUNCTION public.create_idea_post(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_idea_post(TEXT, TEXT, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_authorship ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- OTP tables: no policies for authenticated/anon (service_role bypasses RLS)
-- Explicit deny by enabling RLS with zero policies for client roles.

-- users
CREATE POLICY users_select_self_or_elevated ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR private.is_super_admin()
    OR (
      private.is_admin()
      AND private.admin_covers_region(district, local_level, ward)
    )
  );

CREATE POLICY users_update_self ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY users_super_admin_all ON public.users
  FOR ALL TO authenticated
  USING (private.is_super_admin())
  WITH CHECK (private.is_super_admin());

-- posts
CREATE POLICY posts_select_region ON public.posts
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_super_admin()
      OR private.admin_covers_region(district, local_level, ward)
      OR private.same_district(district)
    )
  );

CREATE POLICY posts_insert_own_region ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    district = (SELECT u.district FROM public.users u WHERE u.id = auth.uid())
    AND local_level = (SELECT u.local_level FROM public.users u WHERE u.id = auth.uid())
    AND ward = (SELECT u.ward FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY posts_update_moderation ON public.posts
  FOR UPDATE TO authenticated
  USING (
    private.is_super_admin()
    OR private.admin_covers_region(district, local_level, ward)
    OR (
      EXISTS (
        SELECT 1 FROM public.post_authorship pa
        WHERE pa.post_id = posts.id AND pa.author_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    private.is_super_admin()
    OR private.admin_covers_region(district, local_level, ward)
    OR (
      EXISTS (
        SELECT 1 FROM public.post_authorship pa
        WHERE pa.post_id = posts.id AND pa.author_id = auth.uid()
      )
    )
  );

-- post_authorship: Super Admin or the author only
CREATE POLICY post_authorship_select_restricted ON public.post_authorship
  FOR SELECT TO authenticated
  USING (
    private.is_super_admin()
    OR author_id = auth.uid()
  );

CREATE POLICY post_authorship_insert_own ON public.post_authorship
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

-- polls
CREATE POLICY polls_select_region ON public.polls
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      private.is_super_admin()
      OR private.admin_covers_region(district, COALESCE(local_level, ''), COALESCE(ward, 0))
      OR private.same_district(district)
    )
  );

CREATE POLICY polls_admin_insert ON public.polls
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_super_admin()
    OR (
      private.is_admin()
      AND admin_id = auth.uid()
      AND private.admin_covers_region(district, COALESCE(local_level, ''), COALESCE(ward, 0))
    )
  );

CREATE POLICY polls_admin_update ON public.polls
  FOR UPDATE TO authenticated
  USING (
    private.is_super_admin()
    OR (
      private.is_admin()
      AND private.admin_covers_region(district, COALESCE(local_level, ''), COALESCE(ward, 0))
    )
  )
  WITH CHECK (
    private.is_super_admin()
    OR (
      private.is_admin()
      AND private.admin_covers_region(district, COALESCE(local_level, ''), COALESCE(ward, 0))
    )
  );

-- votes
CREATE POLICY votes_select_own_or_elevated ON public.votes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR private.is_super_admin()
    OR private.is_admin()
  );

CREATE POLICY votes_insert_own ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY votes_update_own ON public.votes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY votes_delete_own ON public.votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
