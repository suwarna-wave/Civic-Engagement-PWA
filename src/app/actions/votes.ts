"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const voteSchema = z.object({
  postId: z.string().uuid(),
  voteValue: z.union([z.literal(1), z.literal(-1), z.null()]),
});

export type VoteActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function castPostVoteAction(
  postId: unknown,
  voteValue: unknown,
): Promise<VoteActionResult> {
  const parsed = voteSchema.safeParse({ postId, voteValue });
  if (!parsed.success) {
    return { ok: false, error: "Invalid vote payload" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required" };
  }

  if (parsed.data.voteValue === null) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", "post")
      .eq("target_id", parsed.data.postId);

    if (error) {
      return { ok: false, error: "Could not clear vote" };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("votes").upsert(
    {
      user_id: user.id,
      target_type: "post",
      target_id: parsed.data.postId,
      vote_value: parsed.data.voteValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,target_type,target_id" },
  );

  if (error) {
    return { ok: false, error: "Could not save vote" };
  }

  return { ok: true };
}
