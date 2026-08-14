"use client";

import { useOptimistic, useTransition } from "react";
import { castPostVoteAction } from "@/app/actions/votes";
import { useRegionalFeed } from "@/hooks/useRegionalFeed";
import type { FeedPost } from "@/types/database";

type IdeaFeedProps = {
  district?: string | null;
};

type OptimisticAction = {
  postId: string;
  nextVote: -1 | 1 | null;
  previousVote: -1 | 1 | null;
};

function applyOptimisticVote(
  posts: FeedPost[],
  action: OptimisticAction,
): FeedPost[] {
  return posts.map((post) => {
    if (post.id !== action.postId) return post;

    let upvotes = post.upvotes;
    let downvotes = post.downvotes;

    if (action.previousVote === 1) upvotes = Math.max(0, upvotes - 1);
    if (action.previousVote === -1) downvotes = Math.max(0, downvotes - 1);
    if (action.nextVote === 1) upvotes += 1;
    if (action.nextVote === -1) downvotes += 1;

    return {
      ...post,
      upvotes,
      downvotes,
      my_vote: action.nextVote,
    };
  });
}

function authorLabel(post: FeedPost): string {
  if (post.is_anonymous || !post.display_author_id) return "Anonymous citizen";
  return "Verified citizen";
}

export function IdeaFeed({ district }: IdeaFeedProps) {
  const { posts, loading, error, setPosts } = useRegionalFeed({ district });
  const [optimisticPosts, dispatchOptimistic] = useOptimistic(
    posts,
    applyOptimisticVote,
  );
  const [pending, startTransition] = useTransition();

  const onVote = (post: FeedPost, value: -1 | 1) => {
    const previousVote = post.my_vote ?? null;
    const nextVote = previousVote === value ? null : value;

    startTransition(async () => {
      dispatchOptimistic({
        postId: post.id,
        nextVote,
        previousVote,
      });

      const result = await castPostVoteAction(post.id, nextVote);
      if (!result.ok) {
        // Transition end drops optimistic state; keep base posts unchanged.
        return;
      }

      setPosts((current) =>
        applyOptimisticVote(current, {
          postId: post.id,
          nextVote,
          previousVote,
        }),
      );
    });
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-emerald-900/10 bg-white/70 p-6 text-sm text-emerald-950/70">
        Loading regional feed…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (optimisticPosts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-emerald-900/20 bg-white/50 p-8 text-center text-sm text-emerald-950/70">
        No ideas in this region yet. Be the first to post.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4" aria-busy={pending}>
      {optimisticPosts.map((post) => (
        <li
          key={post.id}
          className="rounded-xl border border-emerald-950/10 bg-white/80 p-5 shadow-sm backdrop-blur"
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-emerald-950/55">
            <span>{authorLabel(post)}</span>
            <span>
              {post.district}
              {post.local_level ? ` · ${post.local_level}` : ""}
              {post.ward ? ` · Ward ${post.ward}` : ""}
            </span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-emerald-950">
            {post.title}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950/80">
            {post.content}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onVote(post, 1)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                post.my_vote === 1
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
              }`}
              aria-pressed={post.my_vote === 1}
            >
              ▲ {post.upvotes}
            </button>
            <button
              type="button"
              onClick={() => onVote(post, -1)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                post.my_vote === -1
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 text-stone-800 hover:bg-stone-200"
              }`}
              aria-pressed={post.my_vote === -1}
            >
              ▼ {post.downvotes}
            </button>
            <span className="ml-auto text-xs text-emerald-950/45">
              score {post.upvotes - post.downvotes}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
