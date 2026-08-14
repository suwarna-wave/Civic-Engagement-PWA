export type DemoVote = -1 | 1 | null;
export type IdeaStatus = "Gathering support" | "Acknowledged" | "Under review" | "Planned";

export type DemoComment = {
  id: string;
  postId: string;
  author: string;
  initials: string;
  body: string;
  createdAt: string;
  official?: boolean;
};

export type DemoPost = {
  id: string;
  title: string;
  body: string;
  category: "Infrastructure" | "Environment" | "Public service" | "Youth";
  district: string;
  localLevel: string;
  ward: number;
  author: string;
  initials: string;
  anonymous?: boolean;
  official?: boolean;
  trending?: boolean;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  comments: number;
  myVote: DemoVote;
  saved?: boolean;
  status: IdeaStatus;
  supportGoal: number;
  officialResponse?: {
    office: string;
    message: string;
    respondedAt: string;
  };
  milestones: Array<{
    label: string;
    detail: string;
    complete: boolean;
  }>;
};

export type DemoPoll = {
  id: string;
  question: string;
  description: string;
  scope: string;
  closesIn: string;
  totalVotes: number;
  selected: number | null;
  options: Array<{ label: string; votes: number }>;
};

export const initialPosts: DemoPost[] = [
  {
    id: "idea-school-crossing",
    title: "Safer pedestrian crossings around community schools",
    body: "Mark high-risk crossings, add solar warning lights, and coordinate volunteer crossing support during school hours. A small intervention could make the morning commute safer for hundreds of children.",
    category: "Infrastructure",
    district: "Morang",
    localLevel: "Biratnagar Metropolitan",
    ward: 10,
    author: "Nisha Karki",
    initials: "NK",
    trending: true,
    createdAt: "18 min ago",
    upvotes: 248,
    downvotes: 12,
    comments: 34,
    myVote: null,
    status: "Under review",
    supportGoal: 300,
    officialResponse: {
      office: "Ward 10 Office",
      message: "Thank you for raising this. The municipal traffic unit will conduct a site review near three community schools and share initial recommendations after the field visit.",
      respondedAt: "Today · 09:30",
    },
    milestones: [
      { label: "Idea submitted", detail: "Shared with Ward 10", complete: true },
      { label: "Community threshold", detail: "100 supporters reached", complete: true },
      { label: "Official review", detail: "Site visit is being scheduled", complete: true },
      { label: "Decision", detail: "Awaiting feasibility review", complete: false },
    ],
  },
  {
    id: "idea-waste-calendar",
    title: "Publish a reliable ward-level waste collection calendar",
    body: "A simple monthly schedule—in Nepali and English—would help households prepare waste on time and make missed collections easier to report.",
    category: "Environment",
    district: "Morang",
    localLevel: "Biratnagar Metropolitan",
    ward: 10,
    author: "Anonymous citizen",
    initials: "A",
    anonymous: true,
    createdAt: "1 hr ago",
    upvotes: 186,
    downvotes: 8,
    comments: 21,
    myVote: 1,
    status: "Acknowledged",
    supportGoal: 250,
    officialResponse: {
      office: "Environment Section · Biratnagar Metro",
      message: "The collection team is reviewing route consistency. A pilot calendar for Wards 9 and 10 will be discussed at the next service coordination meeting.",
      respondedAt: "Yesterday · 16:10",
    },
    milestones: [
      { label: "Idea submitted", detail: "Shared anonymously", complete: true },
      { label: "Community threshold", detail: "100 supporters reached", complete: true },
      { label: "Official response", detail: "Environment Section replied", complete: true },
      { label: "Pilot decision", detail: "Coordination meeting pending", complete: false },
    ],
  },
  {
    id: "idea-digital-desk",
    title: "One digital help desk for municipal services",
    body: "Residents should be able to check document requirements, office hours, service fees, and application status without making repeated visits to the municipal office.",
    category: "Public service",
    district: "Morang",
    localLevel: "Biratnagar Metropolitan",
    ward: 10,
    author: "Biratnagar Metro",
    initials: "BM",
    official: true,
    createdAt: "3 hrs ago",
    upvotes: 321,
    downvotes: 19,
    comments: 48,
    myVote: null,
    status: "Planned",
    supportGoal: 400,
    officialResponse: {
      office: "Biratnagar Metropolitan City",
      message: "A unified service-information pilot has been included in the upcoming digital governance work plan. The first version will focus on vital registration and business services.",
      respondedAt: "Monday · 11:45",
    },
    milestones: [
      { label: "Public consultation", detail: "Citizen needs collected", complete: true },
      { label: "Concept approved", detail: "Included in work plan", complete: true },
      { label: "Prototype", detail: "Service catalogue in preparation", complete: true },
      { label: "Public pilot", detail: "Target: next quarter", complete: false },
    ],
  },
  {
    id: "idea-youth-space",
    title: "Turn the unused ward hall into an evening youth space",
    body: "The hall could host study groups, digital literacy sessions, local clubs, and career mentoring after normal office hours.",
    category: "Youth",
    district: "Morang",
    localLevel: "Biratnagar Metropolitan",
    ward: 9,
    author: "Aayush Rai",
    initials: "AR",
    createdAt: "Yesterday",
    upvotes: 143,
    downvotes: 6,
    comments: 17,
    myVote: null,
    status: "Gathering support",
    supportGoal: 200,
    milestones: [
      { label: "Idea submitted", detail: "Visible to Ward 9 residents", complete: true },
      { label: "Community threshold", detail: "Needs 200 supporters", complete: false },
      { label: "Official review", detail: "Unlocks after threshold", complete: false },
      { label: "Decision", detail: "Not started", complete: false },
    ],
  },
];

export const initialComments: DemoComment[] = [
  {
    id: "comment-1",
    postId: "idea-school-crossing",
    author: "Suman Adhikari",
    initials: "SA",
    body: "The crossing near Shree Janata School is especially difficult between 8:30 and 9:00. A field visit at that time would show the real situation.",
    createdAt: "9 min ago",
  },
  {
    id: "comment-2",
    postId: "idea-school-crossing",
    author: "Ward 10 Office",
    initials: "W10",
    body: "Noted. We have shared that timing with the traffic unit for the planned site review.",
    createdAt: "4 min ago",
    official: true,
  },
  {
    id: "comment-3",
    postId: "idea-waste-calendar",
    author: "Meena Rai",
    initials: "MR",
    body: "Please include a simple phone number for missed collections alongside the calendar.",
    createdAt: "32 min ago",
  },
  {
    id: "comment-4",
    postId: "idea-digital-desk",
    author: "Prakash Yadav",
    initials: "PY",
    body: "A checklist for each service would already save citizens several unnecessary visits.",
    createdAt: "1 hr ago",
  },
];

export const initialPolls: DemoPoll[] = [
  {
    id: "poll-green-space",
    question: "Which public-space improvement should Ward 10 prioritize next?",
    description: "Your response will be included in the ward’s upcoming planning discussion.",
    scope: "Ward 10 · Biratnagar",
    closesIn: "Closes in 2 days",
    totalVotes: 1248,
    selected: null,
    options: [
      { label: "More roadside trees", votes: 458 },
      { label: "A children’s play area", votes: 329 },
      { label: "Public exercise equipment", votes: 274 },
      { label: "More shaded seating", votes: 187 },
    ],
  },
  {
    id: "poll-office-hours",
    question: "Would one late-opening municipal service day each week help you?",
    description: "The proposed service window is Wednesday, 10:00–19:00.",
    scope: "Biratnagar Metropolitan",
    closesIn: "Closes in 5 days",
    totalVotes: 784,
    selected: null,
    options: [
      { label: "Yes, it would help", votes: 594 },
      { label: "No, current hours work", votes: 122 },
      { label: "Prefer Saturday service", votes: 68 },
    ],
  },
];
