export interface Platform {
  id: string;
  name: string;
  url: string;
  description: string; // Structured: (Brief description) - (Latest Improvements) - (Version)
  category: string;
  imageUrl: string;
  voteCount: number;
  ownerId: string;
  ownerName: string;
  createdAt: any; // Timestamp or ISO string
  hasVoted?: boolean; // Client-side hydration helper
}

export interface Advice {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
}

export interface UXHeuristics {
  visibilityOfSystemStatus: number;     // 1 to 5
  matchSystemAndRealWorld: number;
  userControlAndFreedom: number;
  consistencyAndStandards: number;
  errorPrevention: number;
  recognitionRatherThanRecall: number;
  flexibilityAndEfficiency: number;
  aestheticAndMinimalistDesign: number;
  helpAndRecoverFromErrors: number;
  helpAndDocumentation: number;
}

export interface HeuristicRating {
  userId: string;
  userName: string;
  ratings: UXHeuristics;
  comment?: string;
  createdAt: any;
}

export interface AIReviewResult {
  scores: { [id: string]: number }; // score 1 to 100 or 1 to 5
  analysis: { [id: string]: string }; // description of how the platform maps to each heuristic
  generalAdvice: string;
}
