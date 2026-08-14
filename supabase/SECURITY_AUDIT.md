# RLS & Auth Security Audit (Simulated)

Date: 2026-08-03  
Scope: `supabase/migrations/20260803100000_init_schema_rls.sql` + OTP Server Actions

## Findings addressed in schema

| Risk | Mitigation |
|------|------------|
| Privilege escalation via `user_metadata` | Role stored in `public.users.role`; helpers read table, not JWT `user_metadata` |
| Anonymous author deanonymization | `author_id` not on `posts`; isolated in `post_authorship` with Super Admin / author SELECT only; public sees `display_author_id` only when not anonymous |
| Cross-district data access | Posts/polls SELECT scoped by `same_district` / `admin_covers_region` / super admin |
| OTP brute force | HMAC-hashed codes, expiry 60–300s, attempt cap, DB-backed send rate limit |
| OTP table exposure | RLS enabled on `otp_challenges` / `otp_rate_limits` with **no** client policies (service_role only) |
| Soft-delete leakage | Feed queries filter `deleted_at IS NULL`; moderation updates set tombstone |
| Service key leakage | Admin client only imported from Server Actions / server modules |

## Residual risks / follow-ups

1. **Admin `users` SELECT** can reveal phone numbers in-jurisdiction — acceptable for moderators; tighten columns via view if needed.
2. **Vote counter trigger** is `SECURITY DEFINER` — constrained to counter updates only; monitor for abuse.
3. **Synthetic email sessions** (`*@phone.swatantra.local`) — ensure Auth email provider cannot send to these; disable email auth in Supabase dashboard.
4. **Realtime filters** are advisory; RLS still enforces row visibility on initial fetch and should be enabled for realtime payloads in project settings.
5. **Onboarding geography** must be completed before `create_idea_post` succeeds.

## Verdict

No critical unmitigated privilege-escalation path identified in the reviewed policies for the 3-tier RBAC model. Proceed with OTP + Realtime integration against a provisioned Supabase project.
