import { createClient } from "@supabase/supabase-js";

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase      = createClient(URL, ANON);
export const supabaseAdmin = createClient(URL, SVC, {
  auth: { persistSession: false },
});

export type ArticleRow = {
  id:             string;
  slug:           string;
  title:          string;
  standfirst:     string | null;
  category:       string;
  labels:         string[];
  status:         "draft" | "published" | "archived";
  featured_image: string | null;
  image_credit:   string | null;
  word_count:     number;
  read_time:      number;
  published_at:   string | null;
  created_at:     string;
  updated_at:     string;
  excerpt:        string | null;
  explains:       string | null;
  why_matters:    string | null;
  takeaways:      string[];
  whats_next:     string[];
  body_html:      string | null;
};
