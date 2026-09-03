// ── Category Configuration ───────────────────────────────────────
import type { CategoryMeta } from "@/types";

export const CATEGORIES: Record<string, CategoryMeta> = {
  "World":     { slug: "World",     label: "World",      color: "#1565c0", bgColor: "#e3f2fd", emoji: null },
  "Tech":      { slug: "Tech",      label: "Tech",       color: "#6a1b9a", bgColor: "#f3e5f5", emoji: null },
  "Culture":   { slug: "Culture",   label: "Culture",    color: "#bf360c", bgColor: "#fbe9e7", emoji: null },
  "Science":   { slug: "Science",   label: "Science",    color: "#2e7d32", bgColor: "#e8f5e9", emoji: null },
  "Music":     { slug: "Music",     label: "Music",      color: "#c62828", bgColor: "#ffebee", emoji: null },
  "Opinion":   { slug: "Opinion",   label: "Opinion",    color: "#92400e", bgColor: "#fff8e1", emoji: null },
  "Travel":    { slug: "Travel",    label: "Travel",     color: "#007a6e", bgColor: "#e0f2f1", emoji: "✈" },
  "Daily-Paws":{ slug: "Daily-Paws",label: "Daily Paws", color: "#c2185b", bgColor: "#fce4ec", emoji: "🐾" },
  "Morning":   { slug: "Morning",   label: "Morning",    color: "#92400e", bgColor: "#fff8e1", emoji: null },
  "Afternoon": { slug: "Afternoon", label: "Afternoon",  color: "#166534", bgColor: "#e8f5e9", emoji: null },
  "Evening":   { slug: "Evening",   label: "Evening",    color: "#4c1d95", bgColor: "#ede7f6", emoji: null },
  "Gadgets":   { slug: "Gadgets",   label: "Gadgets",    color: "#1565c0", bgColor: "#e3f2fd", emoji: null },
  "Review":    { slug: "Review",    label: "Review",     color: "#555",    bgColor: "#f5f5f5", emoji: null },
};

export const NAV_CATEGORIES = [
  "World","Tech","Culture","Science","Music","Opinion","Travel","Daily-Paws"
] as const;

export function getCategoryMeta(label: string): CategoryMeta {
  return CATEGORIES[label] ?? {
    slug: label, label, color: "#052962", bgColor: "#f0f4ff", emoji: null
  };
}

export function getPrimaryLabel(labels: string[]): string {
  const priority = ["Daily-Paws","Travel","Morning","Afternoon","Evening",
                    "World","Tech","Culture","Science","Music","Opinion","Gadgets"];
  return priority.find(p => labels.includes(p)) ?? labels[0] ?? "News";
}
