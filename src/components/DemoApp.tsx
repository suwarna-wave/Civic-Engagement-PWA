"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  initialComments,
  initialPolls,
  initialPosts,
  type DemoComment,
  type DemoPoll,
  type DemoPost,
  type DemoVote,
} from "@/lib/demo/data";

type View = "home" | "polls" | "activity" | "profile";
type FeedFilter = "For you" | "Trending" | "Nearby" | "Official";

type IconName =
  | "home"
  | "poll"
  | "bell"
  | "user"
  | "plus"
  | "search"
  | "map"
  | "chevron"
  | "up"
  | "down"
  | "comment"
  | "share"
  | "bookmark"
  | "more"
  | "check"
  | "spark"
  | "shield"
  | "reset"
  | "install"
  | "close";

const iconPaths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  poll: <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19H2" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  up: <><path d="m6 10 6-6 6 6" /><path d="M12 4v16" /></>,
  down: <><path d="m6 14 6 6 6-6" /><path d="M12 20V4" /></>,
  comment: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></>,
  share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5" /><path d="m8 13 8 5" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8Z" /><path d="m19 15 .7 2.3L22 18.5l-2.3 1.2L19 22l-.7-2.3-2.3-1.2 2.3-1.2Z" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  install: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

const navItems: Array<{ view: View; label: string; icon: IconName }> = [
  { view: "home", label: "Home", icon: "home" },
  { view: "polls", label: "Polls", icon: "poll" },
  { view: "activity", label: "Activity", icon: "bell" },
  { view: "profile", label: "Profile", icon: "user" },
];

const storageKey = "swatantra-aawaj-demo-v3";

function isStoredPosts(value: unknown): value is DemoPost[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const post = item as Partial<DemoPost>;
    return typeof post.id === "string"
      && typeof post.title === "string"
      && typeof post.body === "string"
      && typeof post.upvotes === "number"
      && typeof post.downvotes === "number";
  });
}

function isStoredPolls(value: unknown): value is DemoPoll[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const poll = item as Partial<DemoPoll>;
    return typeof poll.id === "string"
      && typeof poll.question === "string"
      && typeof poll.totalVotes === "number"
      && Array.isArray(poll.options);
  });
}

function isStoredComments(value: unknown): value is DemoComment[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const comment = item as Partial<DemoComment>;
    return typeof comment.id === "string"
      && typeof comment.postId === "string"
      && typeof comment.author === "string"
      && typeof comment.body === "string";
  });
}

export function DemoApp() {
  const [view, setView] = useState<View>("home");
  const [filter, setFilter] = useState<FeedFilter>("For you");
  const [posts, setPosts] = useState<DemoPost[]>(initialPosts);
  const [polls, setPolls] = useState<DemoPoll[]>(initialPolls);
  const [comments, setComments] = useState<DemoComment[]>(initialComments);
  const [hydrated, setHydrated] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { posts?: unknown; polls?: unknown; comments?: unknown };
        if (!isStoredPosts(parsed.posts) || !isStoredPolls(parsed.polls) || !isStoredComments(parsed.comments)) {
          throw new Error("Invalid demo state");
        }
        setPosts(parsed.posts);
        setPolls(parsed.polls);
        setComments(parsed.comments);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ posts, polls, comments }));
  }, [comments, hydrated, polls, posts]);

  useEffect(() => {
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  useEffect(() => {
    const syncIdeaFromUrl = () => {
      const ideaId = new URLSearchParams(window.location.search).get("idea");
      setSelectedPostId(ideaId && initialPosts.some((post) => post.id === ideaId) ? ideaId : null);
    };
    syncIdeaFromUrl();
    window.addEventListener("popstate", syncIdeaFromUrl);
    return () => window.removeEventListener("popstate", syncIdeaFromUrl);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const changeView = (next: View) => {
    setView(next);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openIdea = (postId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("idea", postId);
    window.history.pushState({}, "", url);
    setSelectedPostId(postId);
  };

  const closeIdea = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("idea");
    window.history.replaceState({}, "", url);
    setSelectedPostId(null);
  };

  const votePost = (postId: string, next: Exclude<DemoVote, null>) => {
    setPosts((current) => current.map((post) => {
      if (post.id !== postId) return post;
      const previous = post.myVote;
      const selected: DemoVote = previous === next ? null : next;
      let upvotes = post.upvotes;
      let downvotes = post.downvotes;
      if (previous === 1) upvotes -= 1;
      if (previous === -1) downvotes -= 1;
      if (selected === 1) upvotes += 1;
      if (selected === -1) downvotes += 1;
      return { ...post, myVote: selected, upvotes, downvotes };
    }));
  };

  const toggleSaved = (postId: string) => {
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, saved: !post.saved } : post));
    const post = posts.find((item) => item.id === postId);
    setToast(post?.saved ? "Removed from saved ideas" : "Idea saved for later");
  };

  const sharePost = async (post: DemoPost) => {
    const shareData = { title: post.title, text: `${post.title} — shared from Swatantra Aawaj` };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.text);
        setToast("Idea copied to your clipboard");
      }
    } catch {
      // The native share sheet can be dismissed without requiring an error state.
    }
  };

  const votePoll = (pollId: string, optionIndex: number) => {
    setPolls((current) => current.map((poll) => {
      if (poll.id !== pollId || poll.selected !== null) return poll;
      return {
        ...poll,
        selected: optionIndex,
        totalVotes: poll.totalVotes + 1,
        options: poll.options.map((option, index) => index === optionIndex ? { ...option, votes: option.votes + 1 } : option),
      };
    }));
    setToast("Your voice has been counted");
  };

  const addPost = (data: { title: string; body: string; category: DemoPost["category"]; anonymous: boolean }) => {
    const newPost: DemoPost = {
      id: `demo-${Date.now()}`,
      title: data.title,
      body: data.body,
      category: data.category,
      district: "Morang",
      localLevel: "Biratnagar Metropolitan",
      ward: 10,
      author: data.anonymous ? "Anonymous citizen" : "Aarav Shrestha",
      initials: data.anonymous ? "A" : "AS",
      anonymous: data.anonymous,
      createdAt: "Just now",
      upvotes: 0,
      downvotes: 0,
      comments: 0,
      myVote: null,
      status: "Gathering support",
      supportGoal: 100,
      milestones: [
        { label: "Idea submitted", detail: "Visible to Ward 10 residents", complete: true },
        { label: "Community threshold", detail: "Needs 100 supporters", complete: false },
        { label: "Official review", detail: "Unlocks after threshold", complete: false },
        { label: "Decision", detail: "Not started", complete: false },
      ],
    };
    setPosts((current) => [newPost, ...current]);
    setFilter("For you");
    setView("home");
    setComposerOpen(false);
    setToast("Your idea is now live in the demo feed");
  };

  const resetDemo = () => {
    setPosts(initialPosts);
    setPolls(initialPolls);
    setComments(initialComments);
    window.localStorage.removeItem(storageKey);
    setToast("Demo restored to its original state");
  };

  const installApp = async () => {
    if (installPrompt && "prompt" in installPrompt) {
      await (installPrompt as Event & { prompt: () => Promise<void> }).prompt();
      setInstallPrompt(null);
      return;
    }
    setToast("Use your browser menu and choose “Install app”");
  };

  const visiblePosts = useMemo(() => {
    let result = posts;
    if (filter === "Trending") result = result.filter((post) => post.trending || post.upvotes > 200);
    if (filter === "Nearby") result = result.filter((post) => post.ward === 10);
    if (filter === "Official") result = result.filter((post) => post.official);
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((post) => `${post.title} ${post.body} ${post.category}`.toLowerCase().includes(query));
    }
    return result;
  }, [filter, posts, search]);

  const selectedPost = selectedPostId ? posts.find((post) => post.id === selectedPostId) ?? null : null;

  const addComment = (postId: string, body: string) => {
    const comment: DemoComment = {
      id: `comment-${Date.now()}`,
      postId,
      author: "Aarav Shrestha",
      initials: "AS",
      body,
      createdAt: "Just now",
    };
    setComments((current) => [...current, comment]);
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: post.comments + 1 } : post));
    setToast("Your comment was added to the discussion");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f1] text-[#153c33]">
      <DesktopSidebar view={view} onView={changeView} onCreate={() => setComposerOpen(true)} />

      <div className="lg:pl-[248px]">
        <MobileHeader onSearch={() => setSearchOpen((open) => !open)} onProfile={() => changeView("profile")} />

        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {searchOpen && (
            <div className="mb-4 animate-slide-down lg:hidden">
              <SearchField value={search} onChange={setSearch} />
            </div>
          )}

          {view === "home" && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0">
                <Hero onCreate={() => setComposerOpen(true)} />
                <div className="mb-4 mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">Community pulse</p>
                    <h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#123b31] sm:text-3xl">Ideas from your community</h1>
                  </div>
                  <button type="button" onClick={() => setSearchOpen((open) => !open)} className="icon-button hidden lg:grid" aria-label="Search ideas"><Icon name="search" /></button>
                </div>
                {searchOpen && <div className="mb-4 hidden lg:block"><SearchField value={search} onChange={setSearch} /></div>}
                <FilterBar current={filter} onChange={setFilter} />
                <div className="mt-4 space-y-4">
                  {visiblePosts.length > 0 ? visiblePosts.map((post) => (
                    <PostCard key={post.id} post={post} onVote={votePost} onSave={toggleSaved} onShare={sharePost} onOpen={() => openIdea(post.id)} />
                  )) : <EmptySearch onClear={() => { setSearch(""); setFilter("For you"); }} />}
                </div>
              </section>
              <RightRail polls={polls} posts={posts} onPollVote={votePoll} onViewPolls={() => changeView("polls")} />
            </div>
          )}

          {view === "polls" && <PollsView polls={polls} onVote={votePoll} />}
          {view === "activity" && <ActivityView />}
          {view === "profile" && <ProfileView posts={posts} onReset={resetDemo} onInstall={installApp} />}
        </main>
      </div>

      <MobileNav view={view} onView={changeView} onCreate={() => setComposerOpen(true)} />
      {composerOpen && <Composer onClose={() => setComposerOpen(false)} onSubmit={addPost} />}
      {selectedPost && <IdeaDetail post={selectedPost} comments={comments.filter((comment) => comment.postId === selectedPost.id)} onClose={closeIdea} onVote={votePost} onComment={addComment} />}
      {toast && <Toast message={toast} />}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${compact ? "h-9 w-9" : "h-11 w-11"} grid shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#064e3b] shadow-[0_8px_24px_rgba(6,78,59,.2)]`}>
        <span className="relative block h-6 w-7 rounded-[50%] border-[2.5px] border-white after:absolute after:-bottom-1 after:left-1 after:h-2 after:w-2 after:-rotate-12 after:border-b-[2.5px] after:border-l-[2.5px] after:border-white">
          <span className="absolute bottom-[5px] left-[5px] h-2 w-4 -skew-x-12 border-b-2 border-[#f5bd4f]" />
        </span>
      </div>
      <div>
        <p className="font-display text-[18px] font-semibold leading-none tracking-[-0.025em] text-[#103c32]">Swatantra Aawaj</p>
        {!compact && <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c827a]">स्वतन्त्र आवाज · कोशी</p>}
      </div>
    </div>
  );
}

function DesktopSidebar({ view, onView, onCreate }: { view: View; onView: (view: View) => void; onCreate: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#dfe7e1] bg-white px-5 py-7 lg:flex">
      <Brand />
      <nav className="mt-10 space-y-1.5" aria-label="Primary navigation">
        {navItems.map((item) => (
          <button key={item.view} type="button" onClick={() => onView(item.view)} className={`nav-item ${view === item.view ? "nav-item-active" : ""}`}>
            <Icon name={item.icon} /><span>{item.label}</span>{item.view === "activity" && <span className="ml-auto h-2 w-2 rounded-full bg-[#e89932]" />}
          </button>
        ))}
      </nav>
      <button type="button" onClick={onCreate} className="primary-button mt-7 w-full"><Icon name="plus" className="h-4 w-4" /> Share an idea</button>
      <div className="mt-auto rounded-2xl bg-[#f2f7f3] p-4">
        <div className="mb-3 flex items-center gap-2 text-[#1d6651]"><Icon name="shield" className="h-4 w-4" /><span className="text-xs font-bold">Private by design</span></div>
        <p className="text-xs leading-relaxed text-[#637970]">Your demo activity stays only on this device.</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#8a9a94]"><span className="h-2 w-2 rounded-full bg-[#52a878]" /> Demo mode</div>
      </div>
    </aside>
  );
}

function MobileHeader({ onSearch, onProfile }: { onSearch: () => void; onProfile: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e4eae5]/90 bg-[#f8faf7]/90 px-4 backdrop-blur-xl lg:hidden">
      <Brand compact />
      <div className="flex items-center gap-2"><button className="icon-button" type="button" onClick={onSearch} aria-label="Search"><Icon name="search" /></button><button type="button" onClick={onProfile} className="grid h-10 w-10 place-items-center rounded-full bg-[#d8ede3] text-xs font-bold text-[#126149]" aria-label="Open profile">AS</button></div>
    </header>
  );
}

function Hero({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="hero-panel relative overflow-hidden rounded-[28px] bg-[#073f35] px-5 py-6 text-white shadow-[0_18px_50px_rgba(5,54,45,.16)] sm:px-8 sm:py-8">
      <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
      <div className="relative z-10 max-w-xl">
        <div className="mb-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] text-[#dff6e9]"><span className="h-1.5 w-1.5 rounded-full bg-[#f2bd55]" /> Live demo</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75"><Icon name="map" className="h-3.5 w-3.5" /> Ward 10, Biratnagar</span></div>
        <h2 className="font-display max-w-lg text-[32px] font-semibold leading-[1.06] tracking-[-.045em] sm:text-[42px]">Your idea can move Koshi forward.</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#c9ddd5] sm:text-[15px]">Raise local issues, shape public priorities, and see what your community cares about—all in one trusted civic space.</p>
        <button type="button" onClick={onCreate} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f1bd5a] px-4 py-3 text-sm font-bold text-[#183f34] shadow-[0_8px_25px_rgba(242,189,90,.2)] transition hover:-translate-y-0.5 hover:bg-[#f7ca72]"><Icon name="plus" className="h-4 w-4" /> Share your idea</button>
      </div>
      <div className="absolute bottom-0 right-2 hidden h-full w-[33%] items-end justify-center sm:flex" aria-hidden="true"><div className="mb-5 flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-sm"><div className="grid h-20 w-20 place-items-center rounded-full bg-[#f1bd5a] text-[#073f35]"><Icon name="spark" className="h-10 w-10" /></div></div></div>
    </div>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="relative block"><span className="sr-only">Search community ideas</span><Icon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#80938c]" /><input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search ideas, topics, or services…" className="h-12 w-full rounded-2xl border border-[#dbe4de] bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-[#9aa9a3] focus:border-[#4a947a] focus:ring-4 focus:ring-[#4a947a]/10" /></label>;
}

function FilterBar({ current, onChange }: { current: FeedFilter; onChange: (value: FeedFilter) => void }) {
  const filters: FeedFilter[] = ["For you", "Trending", "Nearby", "Official"];
  return <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${current === item ? "bg-[#123f34] text-white shadow-sm" : "border border-[#dfe6e1] bg-white text-[#61766e] hover:border-[#b7cbc1] hover:text-[#174e3e]"}`}>{item}</button>)}</div>;
}

function statusClasses(status: DemoPost["status"]): string {
  if (status === "Planned") return "bg-[#e3f1e8] text-[#176149]";
  if (status === "Under review") return "bg-[#fff0d5] text-[#9a6017]";
  if (status === "Acknowledged") return "bg-[#e8eff7] text-[#3f6486]";
  return "bg-[#f0f3f1] text-[#687c74]";
}

function PostCard({ post, onVote, onSave, onShare, onOpen }: { post: DemoPost; onVote: (id: string, vote: -1 | 1) => void; onSave: (id: string) => void; onShare: (post: DemoPost) => void; onOpen: () => void }) {
  return (
    <article className="card group p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-extrabold ${post.official ? "bg-[#123f34] text-white" : post.anonymous ? "bg-[#edf0ed] text-[#6e8079]" : "bg-[#dff0e7] text-[#176049]"}`}>{post.official ? <Icon name="shield" className="h-5 w-5" /> : post.initials}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-bold text-[#183f35]">{post.author}</span>{post.official && <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f4ec] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1c7558]"><Icon name="check" className="h-3 w-3" /> Official</span>}<span className="text-xs text-[#8a9a94]">· {post.createdAt}</span></div><p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#84968f]"><Icon name="map" className="h-3 w-3" /> {post.localLevel} · Ward {post.ward}</p></div>
        <button type="button" className="icon-button -mr-2 -mt-1" aria-label="More options"><Icon name="more" /></button>
      </div>
      <div className="mt-4"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f2f5ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#61756d]">{post.category}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(post.status)}`}>{post.status}</span>{post.trending && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#b66e18]"><Icon name="spark" className="h-3 w-3" /> Trending</span>}</div><button type="button" onClick={onOpen} className="block text-left"><h2 className="font-display text-[20px] font-semibold leading-snug tracking-[-.025em] text-[#133d33] transition group-hover:text-[#176149] sm:text-[22px]">{post.title}</h2></button><p className="mt-2 text-[14px] leading-[1.65] text-[#5b7169]">{post.body}</p>{post.officialResponse && <button type="button" onClick={onOpen} className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#267057]"><Icon name="shield" className="h-3.5 w-3.5" /> Official response available <Icon name="chevron" className="h-3 w-3" /></button>}</div>
      <div className="mt-5 flex items-center gap-1 border-t border-[#edf1ee] pt-3">
        <div className="flex items-center rounded-full bg-[#f2f5f2] p-1"><button type="button" onClick={() => onVote(post.id, 1)} className={`vote-button ${post.myVote === 1 ? "vote-button-up" : ""}`} aria-label="Support this idea" aria-pressed={post.myVote === 1}><Icon name="up" className="h-4 w-4" /></button><span className="min-w-[38px] px-1 text-center text-xs font-extrabold text-[#36554a]">{post.upvotes - post.downvotes}</span><button type="button" onClick={() => onVote(post.id, -1)} className={`vote-button ${post.myVote === -1 ? "vote-button-down" : ""}`} aria-label="Oppose this idea" aria-pressed={post.myVote === -1}><Icon name="down" className="h-4 w-4" /></button></div>
        <button type="button" onClick={onOpen} className="action-button"><Icon name="comment" className="h-[18px] w-[18px]" /><span>{post.comments}</span></button>
        <button type="button" onClick={() => void onShare(post)} className="action-button"><Icon name="share" className="h-[18px] w-[18px]" /><span className="hidden sm:inline">Share</span></button>
        <button type="button" onClick={() => onSave(post.id)} className={`action-button ml-auto ${post.saved ? "text-[#176149]" : ""}`} aria-label={post.saved ? "Remove saved idea" : "Save idea"} aria-pressed={post.saved}><Icon name="bookmark" className="h-[18px] w-[18px]" /></button>
      </div>
    </article>
  );
}

function RightRail({ polls, posts, onPollVote, onViewPolls }: { polls: DemoPoll[]; posts: DemoPost[]; onPollVote: (id: string, index: number) => void; onViewPolls: () => void }) {
  const progressed = posts.filter((post) => post.status !== "Gathering support").length;
  return <aside className="hidden space-y-5 xl:block"><div className="sticky top-8 space-y-5"><div className="card p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">Quick poll</p><h3 className="font-display mt-1 text-lg font-semibold tracking-tight">Have your say</h3></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff3da] text-[#a86616]"><Icon name="poll" /></div></div><CompactPoll poll={polls[0]} onVote={onPollVote} /><button type="button" onClick={onViewPolls} className="mt-4 flex w-full items-center justify-center gap-1 border-t border-[#edf1ee] pt-4 text-xs font-bold text-[#176149]">View all polls <Icon name="chevron" className="h-3.5 w-3.5" /></button></div><div className="overflow-hidden rounded-2xl bg-[#123f34] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#a9c9bd]">Civic progress</p><Icon name="spark" className="h-5 w-5 text-[#f1bd5a]" /></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-2xl font-extrabold">{progressed}</p><p className="mt-1 text-[10px] leading-snug text-white/55">ideas moved forward</p></div><div><p className="text-2xl font-extrabold">67%</p><p className="mt-1 text-[10px] leading-snug text-white/55">official response rate</p></div></div><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-bold text-white/85">How an idea moves</p><div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-white/55"><span className="rounded-full bg-white/10 px-2 py-1">Support</span><span>→</span><span className="rounded-full bg-white/10 px-2 py-1">Review</span><span>→</span><span className="rounded-full bg-white/10 px-2 py-1">Action</span></div></div></div></div></aside>;
}

function CompactPoll({ poll, onVote }: { poll: DemoPoll; onVote: (id: string, index: number) => void }) {
  return <div className="mt-4"><p className="text-sm font-bold leading-snug text-[#23483e]">{poll.question}</p><div className="mt-3 space-y-2">{poll.options.slice(0, 3).map((option, index) => <button key={option.label} type="button" disabled={poll.selected !== null} onClick={() => onVote(poll.id, index)} className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${poll.selected === index ? "border-[#247157] bg-[#e8f4ed] text-[#176149]" : "border-[#e2e9e4] hover:border-[#8eb7a5] disabled:cursor-default"}`}>{option.label}</button>)}</div><p className="mt-3 text-[10px] font-semibold text-[#82948d]">{poll.totalVotes.toLocaleString()} responses · {poll.closesIn}</p></div>;
}

function PollsView({ polls, onVote }: { polls: DemoPoll[]; onVote: (id: string, index: number) => void }) {
  return <section className="mx-auto max-w-3xl"><PageHeading eyebrow="Shape priorities" title="Community polls" description="Quick questions from local representatives and civic groups. Every response helps reveal what matters most." icon="poll" /><div className="mt-7 space-y-5">{polls.map((poll) => <PollCard key={poll.id} poll={poll} onVote={onVote} />)}</div></section>;
}

function PollCard({ poll, onVote }: { poll: DemoPoll; onVote: (id: string, index: number) => void }) {
  const maxVotes = Math.max(...poll.options.map((option) => option.votes));
  return <article className="card p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf4ee] px-3 py-1.5 text-[11px] font-bold text-[#246650]"><Icon name="map" className="h-3.5 w-3.5" /> {poll.scope}</span><span className="text-xs font-semibold text-[#87968f]">{poll.closesIn}</span></div><h2 className="font-display mt-5 text-2xl font-semibold leading-tight tracking-[-.035em] text-[#133d33]">{poll.question}</h2><p className="mt-2 text-sm leading-relaxed text-[#657a72]">{poll.description}</p><div className="mt-6 space-y-3">{poll.options.map((option, index) => { const percent = Math.round((option.votes / poll.totalVotes) * 100); const showResults = poll.selected !== null; return <button key={option.label} type="button" onClick={() => onVote(poll.id, index)} disabled={showResults} className={`relative w-full overflow-hidden rounded-xl border px-4 py-3.5 text-left transition ${poll.selected === index ? "border-[#2c7a5d] bg-[#edf7f1]" : "border-[#dde6e0] bg-white hover:border-[#80aa98] disabled:cursor-default"}`}><span className="absolute inset-y-0 left-0 bg-[#e3f1e8] transition-all duration-700" style={{ width: showResults ? `${percent}%` : "0%", opacity: option.votes === maxVotes ? 1 : .55 }} /><span className="relative flex items-center justify-between gap-3 text-sm"><span className={`font-bold ${poll.selected === index ? "text-[#176149]" : "text-[#38574c]"}`}>{option.label}</span>{showResults && <span className="font-extrabold text-[#285f4c]">{percent}%</span>}</span></button>; })}</div><div className="mt-5 flex items-center justify-between text-xs text-[#82928c]"><span>{poll.totalVotes.toLocaleString()} people responded</span><span className="inline-flex items-center gap-1 font-bold text-[#39705d]"><Icon name="shield" className="h-3.5 w-3.5" /> One person, one response</span></div></article>;
}

function ActivityView() {
  const activity = [
    { icon: "up" as IconName, title: "Your supported idea is gaining momentum", detail: "Safer pedestrian crossings now has 248 supporters.", time: "12 min" },
    { icon: "comment" as IconName, title: "New discussion in your ward", detail: "Six citizens added practical suggestions to the waste calendar idea.", time: "1 hr" },
    { icon: "poll" as IconName, title: "A new community poll is open", detail: "Choose which public-space improvement Ward 10 should prioritize.", time: "3 hrs" },
    { icon: "shield" as IconName, title: "Municipal update published", detail: "Biratnagar Metro shared a proposal for a digital public-service desk.", time: "Yesterday" },
  ];
  return <section className="mx-auto max-w-3xl"><PageHeading eyebrow="From voice to action" title="Community impact" description="See how participation is turning into acknowledgement, review, and visible local action." icon="bell" /><div className="mt-7 grid gap-3 sm:grid-cols-3"><ImpactMetric value="42" label="Ideas this month" detail="Across Biratnagar" /><ImpactMetric value="18" label="Official responses" detail="Up 24% this month" /><ImpactMetric value="7" label="Moved to action" detail="Planned or underway" /></div><div className="mb-3 mt-8 flex items-center justify-between"><h2 className="font-display text-xl font-semibold tracking-tight">Recent updates</h2><span className="rounded-full bg-[#e7f2eb] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#297057]">4 new</span></div><div className="card divide-y divide-[#edf1ee] px-5">{activity.map((item) => <div key={item.title} className="flex gap-4 py-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ed] text-[#267057]"><Icon name={item.icon} className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-[#24493f]">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-[#71837c]">{item.detail}</p></div><span className="shrink-0 text-[11px] text-[#96a49f]">{item.time}</span></div>)}</div></section>;
}

function ImpactMetric({ value, label, detail }: { value: string; label: string; detail: string }) {
  return <div className="card p-4"><p className="font-display text-3xl font-semibold tracking-tight text-[#145440]">{value}</p><p className="mt-1 text-xs font-extrabold text-[#31564a]">{label}</p><p className="mt-1 text-[10px] text-[#8a9993]">{detail}</p></div>;
}

function ProfileView({ posts, onReset, onInstall }: { posts: DemoPost[]; onReset: () => void; onInstall: () => void }) {
  const supported = posts.filter((post) => post.myVote === 1).length;
  return <section className="mx-auto max-w-3xl"><div className="overflow-hidden rounded-[28px] bg-[#0a493c] text-white shadow-sm"><div className="profile-pattern h-24" /><div className="px-6 pb-7 sm:px-8"><div className="-mt-10 flex flex-wrap items-end justify-between gap-4"><div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-[#0a493c] bg-[#f2bd5b] text-xl font-extrabold text-[#173e33] shadow-lg">AS</div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">Demo citizen</span></div><h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">Aarav Shrestha</h1><p className="mt-1 flex items-center gap-1.5 text-sm text-white/65"><Icon name="map" className="h-4 w-4" /> Ward 10 · Biratnagar Metropolitan · Morang</p><div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center"><ProfileStat value={posts.filter((post) => post.author === "Aarav Shrestha").length} label="Ideas" /><ProfileStat value={supported} label="Supported" /><ProfileStat value={posts.filter((post) => post.saved).length} label="Saved" /></div></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><ProfileAction icon="install" title="Install this PWA" detail="Add it to your home screen" onClick={onInstall} /><ProfileAction icon="reset" title="Reset demo" detail="Restore original ideas and polls" onClick={onReset} /></div><div className="card mt-6 p-5"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f3ec] text-[#257157]"><Icon name="shield" /></div><div><h2 className="text-sm font-bold">Demo privacy</h2><p className="mt-1 text-sm leading-relaxed text-[#71827c]">This version has no account and sends nothing to a server. Your interactions are stored only in this browser and can be reset at any time.</p></div></div></div></section>;
}

function ProfileStat({ value, label }: { value: number; label: string }) { return <div><p className="text-xl font-extrabold">{value}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.12em] text-white/50">{label}</p></div>; }
function ProfileAction({ icon, title, detail, onClick }: { icon: IconName; title: string; detail: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="card flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#b9d0c4]"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf4ef] text-[#24674f]"><Icon name={icon} /></div><span><span className="block text-sm font-bold">{title}</span><span className="mt-0.5 block text-xs text-[#7b8e86]">{detail}</span></span><Icon name="chevron" className="ml-auto h-4 w-4 text-[#9aaba4]" /></button>; }

function PageHeading({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: IconName }) { return <div className="flex items-start gap-4"><div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#123f34] text-[#f2bd5a] sm:grid"><Icon name={icon} className="h-7 w-7" /></div><div><p className="eyebrow">{eyebrow}</p><h1 className="font-display mt-1 text-3xl font-semibold tracking-[-.04em] text-[#123b31] sm:text-4xl">{title}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6a7e76]">{description}</p></div></div>; }

function IdeaDetail({ post, comments, onClose, onVote, onComment }: { post: DemoPost; comments: DemoComment[]; onClose: () => void; onVote: (id: string, vote: -1 | 1) => void; onComment: (id: string, body: string) => void }) {
  const [comment, setComment] = useState("");
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [onClose]);
  const progress = Math.min(100, Math.round((post.upvotes / post.supportGoal) * 100));
  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    const value = comment.trim();
    if (value.length < 3) return;
    onComment(post.id, value);
    setComment("");
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#062f28]/60 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="idea-detail-title" className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-[#f7f9f5] shadow-2xl sm:max-w-2xl sm:rounded-[28px]"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8e4] bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-6"><div><p className="eyebrow">Idea details</p><p className="mt-0.5 text-xs font-semibold text-[#72867e]">{post.localLevel} · Ward {post.ward}</p></div><button type="button" onClick={onClose} className="icon-button" aria-label="Close idea details"><Icon name="close" /></button></div><div className="space-y-4 p-4 sm:p-6"><article className="card p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#eef2ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#60746c]">{post.category}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(post.status)}`}>{post.status}</span></div><h2 id="idea-detail-title" className="font-display mt-4 text-2xl font-semibold leading-tight tracking-[-.035em] text-[#123d32] sm:text-3xl">{post.title}</h2><div className="mt-3 flex items-center gap-2 text-xs text-[#81928c]"><span className="font-bold text-[#31574a]">{post.author}</span><span>·</span><span>{post.createdAt}</span></div><p className="mt-5 text-sm leading-[1.75] text-[#566e65]">{post.body}</p><div className="mt-6 rounded-2xl bg-[#f0f5f1] p-4"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-extrabold text-[#244c3e]">Community support</p><p className="mt-1 text-[11px] text-[#7c8e87]">{post.upvotes} of {post.supportGoal} supporter goal</p></div><span className="text-sm font-extrabold text-[#176149]">{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce7e0]"><div className="h-full rounded-full bg-[#2e8565] transition-all duration-500" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex gap-2"><button type="button" onClick={() => onVote(post.id, 1)} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold transition ${post.myVote === 1 ? "bg-[#176149] text-white" : "bg-white text-[#285c49] shadow-sm"}`}><Icon name="up" className="h-4 w-4" /> {post.myVote === 1 ? "Supported" : "Support this idea"}</button><button type="button" onClick={() => onVote(post.id, -1)} className={`grid h-11 w-11 place-items-center rounded-xl transition ${post.myVote === -1 ? "bg-[#a75b45] text-white" : "bg-white text-[#7c8b86] shadow-sm"}`} aria-label="Oppose this idea"><Icon name="down" className="h-4 w-4" /></button></div></div></article>{post.officialResponse && <section className="overflow-hidden rounded-2xl border border-[#cfe2d7] bg-white"><div className="flex items-center gap-2 border-b border-[#e1ece5] bg-[#edf6f0] px-5 py-3 text-xs font-extrabold text-[#23654d]"><Icon name="shield" className="h-4 w-4" /> Verified official response</div><div className="p-5"><div className="flex items-start justify-between gap-4"><p className="text-sm font-extrabold text-[#23493d]">{post.officialResponse.office}</p><span className="shrink-0 text-[10px] text-[#8c9b96]">{post.officialResponse.respondedAt}</span></div><p className="mt-3 text-sm leading-relaxed text-[#5e746b]">{post.officialResponse.message}</p></div></section>}<section className="card p-5"><h3 className="font-display text-lg font-semibold tracking-tight">Progress journey</h3><div className="mt-5 space-y-0">{post.milestones.map((milestone, index) => <div key={milestone.label} className="relative flex gap-3 pb-5 last:pb-0">{index < post.milestones.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-px ${milestone.complete ? "bg-[#79ae96]" : "bg-[#dfe6e1]"}`} />}<span className={`relative z-[1] grid h-6 w-6 shrink-0 place-items-center rounded-full border ${milestone.complete ? "border-[#2e805f] bg-[#2e805f] text-white" : "border-[#cfdad4] bg-white text-[#a1afa9]"}`}>{milestone.complete ? <Icon name="check" className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><div><p className={`text-xs font-extrabold ${milestone.complete ? "text-[#275244]" : "text-[#82928c]"}`}>{milestone.label}</p><p className="mt-0.5 text-[11px] text-[#8a9993]">{milestone.detail}</p></div></div>)}</div></section><section className="card p-5"><div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold tracking-tight">Community discussion</h3><span className="text-[10px] font-bold text-[#8c9b95]">{post.comments} comments</span></div><div className="mt-4 space-y-4">{comments.length > 0 ? comments.map((item) => <div key={item.id} className="flex gap-3"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-extrabold ${item.official ? "bg-[#184f40] text-white" : "bg-[#e3efe8] text-[#24664f]"}`}>{item.official ? <Icon name="shield" className="h-4 w-4" /> : item.initials}</div><div className="min-w-0 flex-1 rounded-r-xl rounded-bl-xl bg-[#f3f6f3] px-3.5 py-3"><div className="flex flex-wrap items-center gap-1.5"><span className="text-xs font-extrabold text-[#315348]">{item.author}</span>{item.official && <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#267057]">Official</span>}<span className="text-[9px] text-[#97a49f]">· {item.createdAt}</span></div><p className="mt-1.5 text-xs leading-relaxed text-[#657a72]">{item.body}</p></div></div>) : <p className="rounded-xl bg-[#f3f6f3] p-4 text-center text-xs text-[#7b8d86]">Start a constructive discussion about this idea.</p>}</div><form onSubmit={submitComment} className="mt-5 flex items-end gap-2 border-t border-[#edf1ee] pt-4"><label className="flex-1"><span className="sr-only">Add a constructive comment</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={280} rows={2} placeholder="Add a constructive comment…" className="w-full resize-none rounded-xl border border-[#dce5df] bg-[#fafbf9] px-3.5 py-3 text-xs leading-relaxed outline-none focus:border-[#57927b] focus:ring-4 focus:ring-[#57927b]/10" /></label><button type="submit" disabled={comment.trim().length < 3} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#123f34] text-white transition disabled:opacity-40" aria-label="Post comment"><Icon name="share" className="h-4 w-4 -rotate-45" /></button></form></section><p className="px-2 pb-2 text-center text-[10px] leading-relaxed text-[#899892]">Demo content only. No submission is sent to a government office.</p></div></section></div>;
}

function Composer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { title: string; body: string; category: DemoPost["category"]; anonymous: boolean }) => void }) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [category, setCategory] = useState<DemoPost["category"]>("Public service"); const [anonymous, setAnonymous] = useState(false);
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", close); document.body.style.overflow = "hidden"; return () => { window.removeEventListener("keydown", close); document.body.style.overflow = ""; }; }, [onClose]);
  const submit = (event: FormEvent) => { event.preventDefault(); if (title.trim().length < 8 || body.trim().length < 20) return; onSubmit({ title: title.trim(), body: body.trim(), category, anonymous }); };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#062f28]/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="composer-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-[28px] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Start a conversation</p><h2 id="composer-title" className="font-display mt-1 text-2xl font-semibold tracking-tight">Share an idea</h2></div><button type="button" onClick={onClose} className="icon-button" aria-label="Close composer"><Icon name="close" /></button></div><form onSubmit={submit} className="mt-6 space-y-5"><label className="field-label">Idea title<input autoFocus value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="What would make your community better?" className="field-input" /><span className="field-hint">{title.length}/120</span></label><label className="field-label">Describe your idea<textarea value={body} maxLength={700} onChange={(event) => setBody(event.target.value)} placeholder="Explain the problem and the change you would like to see…" rows={5} className="field-input resize-none" /><span className="field-hint">{body.length}/700</span></label><div><span className="field-label">Topic</span><div className="mt-2 flex flex-wrap gap-2">{(["Infrastructure", "Environment", "Public service", "Youth"] as DemoPost["category"][]).map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-3 py-2 text-xs font-bold ${category === item ? "bg-[#153f34] text-white" : "bg-[#eff3f0] text-[#61746d]"}`}>{item}</button>)}</div></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e8e3] p-4"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#176149]" /><span><span className="block text-sm font-bold text-[#294d42]">Post anonymously</span><span className="mt-1 block text-xs leading-relaxed text-[#788a83]">Your name will be hidden from the public demo feed.</span></span></label><div className="flex items-center justify-between gap-3 border-t border-[#edf1ee] pt-5"><p className="hidden text-xs text-[#899991] sm:block"><Icon name="map" className="mr-1 inline h-3.5 w-3.5" /> Ward 10 · Biratnagar</p><button type="submit" disabled={title.trim().length < 8 || body.trim().length < 20} className="primary-button ml-auto disabled:cursor-not-allowed disabled:opacity-45"><Icon name="spark" className="h-4 w-4" /> Publish idea</button></div></form></section></div>;
}

function MobileNav({ view, onView, onCreate }: { view: View; onView: (view: View) => void; onCreate: () => void }) { return <nav className="fixed inset-x-0 bottom-0 z-30 grid h-[76px] grid-cols-5 border-t border-[#dce5df] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(26,65,53,.08)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">{navItems.slice(0, 2).map((item) => <MobileNavButton key={item.view} item={item} active={view === item.view} onClick={() => onView(item.view)} />)}<button type="button" onClick={onCreate} className="relative -top-4 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f0b94e] text-[#173e34] shadow-[0_10px_25px_rgba(192,129,22,.28)]" aria-label="Share an idea"><Icon name="plus" className="h-6 w-6" /></button>{navItems.slice(2).map((item) => <MobileNavButton key={item.view} item={item} active={view === item.view} onClick={() => onView(item.view)} />)}</nav>; }
function MobileNavButton({ item, active, onClick }: { item: { label: string; icon: IconName }; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${active ? "text-[#176149]" : "text-[#83958e]"}`}><Icon name={item.icon} className="h-5 w-5" /><span>{item.label}</span></button>; }

function EmptySearch({ onClear }: { onClear: () => void }) { return <div className="card flex flex-col items-center px-6 py-14 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#edf3ef] text-[#618176]"><Icon name="search" className="h-6 w-6" /></div><h2 className="font-display mt-4 text-xl font-semibold">No ideas found</h2><p className="mt-2 max-w-sm text-sm text-[#75877f]">Try another word or return to the full community feed.</p><button type="button" onClick={onClear} className="mt-5 text-sm font-bold text-[#176149]">Clear search and filters</button></div>; }
function Toast({ message }: { message: string }) { return <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 animate-toast items-center gap-2 whitespace-nowrap rounded-full bg-[#123f34] px-4 py-3 text-xs font-bold text-white shadow-xl lg:bottom-7"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#f1bd5a] text-[#123f34]"><Icon name="check" className="h-3 w-3" /></span>{message}</div>; }
