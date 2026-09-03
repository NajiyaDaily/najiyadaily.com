"use client";
import { useEffect, useState } from "react";
import type { ArticleRow } from "@/lib/supabase";

type Tab = "drafts" | "published" | "archived";

export default function AdminDashboard() {
  const [tab,      setTab]      = useState<Tab>("drafts");
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [secret,   setSecret]   = useState("");
  const [authed,   setAuthed]   = useState(false);
  const [toast,    setToast]    = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = async (status: Tab) => {
    setLoading(true);
    const res  = await fetch(`/api/articles?status=${status}&limit=50`);
    const data = await res.json();
    setArticles(data.articles ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) load(tab);
  }, [tab, authed]);

  const action = async (slug: string, body: Partial<ArticleRow>) => {
    const res = await fetch(`/api/articles/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json", "x-admin-secret": secret },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      showToast(body.status === "published" ? "✅ Published!" : "✅ Done");
      load(tab);
    } else {
      showToast("❌ Action failed — check your admin secret");
    }
  };

  const del = async (slug: string) => {
    if (!confirm("Delete this article permanently?")) return;
    const res = await fetch(`/api/articles/${slug}`, {
      method: "DELETE",
      headers: { "x-admin-secret": secret },
    });
    if (res.ok) { showToast("🗑 Deleted"); load(tab); }
    else showToast("❌ Delete failed");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white border border-nd-border rounded-lg p-8 w-full max-w-sm shadow-sm">
          <div className="font-serif text-2xl font-black text-navy mb-6">
            Najiya<span className="text-gold">Daily</span>
            <div className="font-sans text-xs font-normal text-nd-muted mt-1 tracking-widest uppercase">
              Admin Dashboard
            </div>
          </div>
          <input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setAuthed(true)}
            className="w-full border border-nd-border rounded px-3 py-2.5 font-sans text-sm
                       outline-none focus:border-navy mb-3"
          />
          <button
            onClick={() => setAuthed(true)}
            className="w-full bg-navy text-white font-sans font-semibold text-sm py-2.5 rounded
                       hover:bg-navy2 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id:"drafts",    label:"Drafts",    color:"text-amber-700" },
    { id:"published", label:"Published", color:"text-green-700" },
    { id:"archived",  label:"Archived",  color:"text-nd-muted"  },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-navy border-b-2 border-gold px-6 py-4 flex items-center justify-between">
        <div className="font-serif text-xl font-black text-white">
          Najiya<span className="text-gold">Daily</span>
          <span className="font-sans text-xs font-normal text-white/50 ml-3 tracking-widest uppercase">
            Admin
          </span>
        </div>
        <a href="/" target="_blank"
           className="font-sans text-xs text-white/60 hover:text-white border border-white/20
                      px-3 py-1.5 rounded transition-colors">
          View Site ↗
        </a>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {tabs.map((t) => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className={`bg-white border rounded-lg p-4 text-left transition-all
                ${tab === t.id ? "border-navy shadow-sm" : "border-nd-border hover:border-nd-muted"}`}>
              <div className={`font-sans text-[9px] font-bold tracking-widest uppercase mb-1 ${t.color}`}>
                {t.label}
              </div>
              <div className="font-serif text-2xl font-black text-nd-ink">
                {tab === t.id ? articles.length : "—"}
              </div>
            </button>
          ))}
        </div>

        {/* Article table */}
        <div className="bg-white border border-nd-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-nd-border flex items-center gap-3">
            {tabs.map((t) => (
              <button key={t.id}
                onClick={() => setTab(t.id)}
                className={`font-sans text-sm font-semibold px-3 py-1.5 rounded transition-colors
                  ${tab === t.id ? "bg-navy text-white" : "text-nd-muted hover:text-nd-ink"}`}>
                {t.label}
              </button>
            ))}
            <button onClick={() => load(tab)}
              className="ml-auto font-sans text-xs text-nd-muted hover:text-nd-ink transition-colors">
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center font-sans text-sm text-nd-muted">Loading…</div>
          ) : articles.length === 0 ? (
            <div className="px-5 py-12 text-center font-sans text-sm text-nd-muted">
              No {tab} articles.
            </div>
          ) : (
            <div className="divide-y divide-nd-border2">
              {articles.map((a) => (
                <div key={a.id} className="px-5 py-4 flex items-start gap-4 hover:bg-paper transition-colors">
                  {/* Thumbnail */}
                  <div className="w-16 h-12 flex-shrink-0 bg-paper rounded overflow-hidden">
                    {a.featured_image && (
                      <img src={a.featured_image} alt="" className="w-full h-full object-cover"/>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wide text-navy">
                        {a.category}
                      </span>
                      <span className="font-sans text-[9px] text-nd-light">
                        {a.word_count.toLocaleString()} words · {a.read_time} min
                      </span>
                    </div>
                    <h3 className="font-serif text-[15px] font-bold text-nd-ink leading-snug line-clamp-2 mb-1">
                      {a.title}
                    </h3>
                    <p className="font-sans text-[11px] text-nd-muted line-clamp-1">
                      {a.excerpt}
                    </p>
                    <div className="font-sans text-[10px] text-nd-light mt-1">
                      Created: {new Date(a.created_at).toLocaleString("en-US",
                        { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {tab === "drafts" && (
                      <>
                        <button
                          onClick={() => action(a.slug, { status:"published" })}
                          className="font-sans text-[11px] font-bold px-3 py-1.5 bg-green-600
                                     text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap">
                          ✓ Publish
                        </button>
                        <button
                          onClick={() => action(a.slug, { status:"archived" })}
                          className="font-sans text-[11px] px-3 py-1.5 border border-nd-border
                                     text-nd-muted rounded hover:border-nd-ink transition-colors whitespace-nowrap">
                          Archive
                        </button>
                      </>
                    )}
                    {tab === "published" && (
                      <button
                        onClick={() => action(a.slug, { status:"archived" })}
                        className="font-sans text-[11px] px-3 py-1.5 border border-nd-border
                                   text-nd-muted rounded hover:border-red-400 hover:text-red-600
                                   transition-colors whitespace-nowrap">
                        Unpublish
                      </button>
                    )}
                    {tab === "archived" && (
                      <button
                        onClick={() => action(a.slug, { status:"published" })}
                        className="font-sans text-[11px] font-bold px-3 py-1.5 bg-navy
                                   text-white rounded hover:bg-navy2 transition-colors whitespace-nowrap">
                        Restore
                      </button>
                    )}
                    <a href={`/posts/${a.slug}`} target="_blank"
                       className="font-sans text-[11px] px-3 py-1.5 border border-nd-border
                                  text-nd-muted rounded hover:border-nd-ink text-center
                                  transition-colors whitespace-nowrap">
                      Preview ↗
                    </a>
                    <button
                      onClick={() => del(a.slug)}
                      className="font-sans text-[11px] px-3 py-1.5 text-red-400
                                 hover:text-red-600 transition-colors text-right">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-nd-ink text-white font-sans text-sm
                        px-4 py-3 rounded-lg shadow-lg z-50 animate-[slideUp_.2s_ease]">
          {toast}
        </div>
      )}
    </div>
  );
}
