"use client";
export function FloatingShare({ url, title }: { url: string; title: string }) {
  const enc = (s: string) => encodeURIComponent(s);
  const copy = () => {
    navigator.clipboard.writeText(url).catch(() => {});
  };
  return (
    <div className="hidden xl:flex sticky top-28 float-left -ml-16 w-11 flex-col gap-2 z-10">
      {[
        { label: "𝕏", href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}` },
        { label: "💬", href: `https://api.whatsapp.com/send?text=${enc(title + " " + url)}` },
        { label: "f",  href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
      ].map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener"
           className="w-11 h-11 rounded-full bg-white border border-nd-border flex items-center
                      justify-center text-[15px] text-nd-ink2 hover:bg-navy hover:text-white
                      hover:border-navy transition-all">
          {s.label}
        </a>
      ))}
      <button onClick={copy}
        className="w-11 h-11 rounded-full bg-white border border-nd-border flex items-center
                   justify-center text-[15px] text-nd-ink2 hover:bg-navy hover:text-white
                   hover:border-navy transition-all">
        🔗
      </button>
    </div>
  );
}
