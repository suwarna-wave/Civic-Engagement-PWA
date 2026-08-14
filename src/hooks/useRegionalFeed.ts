"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FeedPost, Post } from "@/types/database";

type UseRegionalFeedOptions = {
  district?: string | null;
  limit?: number;
};

type UseRegionalFeedResult = {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>;
};

export function useRegionalFeed(
  options: UseRegionalFeedOptions = {},
): UseRegionalFeedResult {
  const { district, limit = 50 } = options;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    setError(null);

    let query = supabase
      .from("posts")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (district) {
      query = query.eq("district", district);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Post[];

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let myVotes: Record<string, -1 | 1> = {};
    if (user && rows.length > 0) {
      const { data: votes } = await supabase
        .from("votes")
        .select("target_id, vote_value")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .in(
          "target_id",
          rows.map((p) => p.id),
        );

      myVotes = Object.fromEntries(
        (votes ?? []).map((v) => [v.target_id, v.vote_value as -1 | 1]),
      );
    }

    setPosts(
      rows.map((post) => ({
        ...post,
        my_vote: myVotes[post.id] ?? null,
      })),
    );
    setLoading(false);
  }, [district, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`regional-feed:${district ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          ...(district ? { filter: `district=eq.${district}` } : {}),
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Post;
            if (row.deleted_at) return;
            setPosts((current) => {
              if (current.some((p) => p.id === row.id)) return current;
              return [{ ...row, my_vote: null }, ...current].slice(0, limit);
            });
            return;
          }

          if (payload.eventType === "UPDATE") {
            const row = payload.new as Post;
            setPosts((current) => {
              if (row.deleted_at) {
                return current.filter((p) => p.id !== row.id);
              }
              return current.map((p) =>
                p.id === row.id
                  ? {
                      ...p,
                      ...row,
                      my_vote: p.my_vote,
                    }
                  : p,
              );
            });
            return;
          }

          if (payload.eventType === "DELETE") {
            const row = payload.old as Post;
            setPosts((current) => current.filter((p) => p.id !== row.id));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [district, limit]);

  return { posts, loading, error, refresh, setPosts };
}
