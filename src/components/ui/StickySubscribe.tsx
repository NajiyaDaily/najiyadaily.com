"use client";
import { useEffect, useState } from "react";
export function StickySubscribe() {
  const [visible, setVisible] = useState(false);
  const [closed,  setClosed]  = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("nd-sub-closed")) { setClosed(true); return; }
    const onScroll = () => {
      const s = document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (h > 0 && s / h > 0.4) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const dismiss = () => {
    setClosed(true);
    sessionStorage.setItem("nd-sub-closed", "1");
  };
  if (closed || !visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#041f4a] border-t-2 border-gold
                    px-5 py-3 flex flex-wrap items-center justify-between gap-3
                    animate-[slideUp_.3s_ease]">
      <p className="font-sans text-[13px] text-white/80">
        <strong className="text-white">Never miss a story.</strong> Get NajiyaDaily delivered free.
      </p>
      <div className="flex gap-2 items-center">
        <input type="email" placeholder="your@email.com"
          className="border border-white/25 bg-white/10 text-white placeholder-white/40
                     font-sans text-[13px] px-3 py-2 rounded-sm outline-none w-48" />
        <button
          onClick={() => window.open("https://feedburner.google.com/fb/a/mailverify?uri=NajiyaDaily&loc=en_US","_blank")}
          className="bg-gold text-navy font-sans text-[12px] font-bold px-4 py-2 rounded-sm
                     hover:opacity-90 transition-opacity whitespace-nowrap">
          Subscribe Free
        </button>
        <button onClick={dismiss} className="text-white/40 hover:text-white text-xl leading-none px-1">×</button>
      </div>
    </div>
  );
}
