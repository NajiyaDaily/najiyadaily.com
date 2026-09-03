// ── NajiyaDaily Complete Type System ────────────────────────────

export type Category =
  | "World" | "Tech" | "Culture" | "Science"
  | "Music" | "Opinion" | "Travel" | "Daily-Paws"
  | "Morning" | "Afternoon" | "Evening"
  | "Gadgets" | "Review";

export interface BloggerPost {
  id:           string;
  title:        string;
  content:      string;
  url:          string;
  slug:         string;
  published:    string;
  updated:      string;
  labels:       string[];
  author:       string;
  featuredImage: string | null;
  snippet:      string;
  wordCount:    number;
  readTime:     number;
}

export interface NajiyaArticle extends BloggerPost {
  standfirst:       string | null;
  explains:         string | null;
  whyMatters:       string | null;
  takeaways:        string[];
  whatsNext:        string[];
  pullQuotes:       string[];
  heroImageCredit:  string | null;
  hasAffiliateLinks: boolean;
  affiliateType:    "amazon" | "booking" | "skimlinks" | null;
}

export interface CategoryMeta {
  slug:    string;
  label:   string;
  color:   string;
  bgColor: string;
  emoji:   string | null;
}

export interface PaginatedPosts {
  posts:     BloggerPost[];
  nextToken: string | null;
  total:     number;
}
