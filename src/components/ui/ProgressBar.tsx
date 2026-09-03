"use client";
import { useEffect } from "react";
export function ProgressBar() {
  useEffect(() => {
    const bar = document.getElementById("nd-progress-bar");
    const update = () => {
      if (!bar) return;
      const s = document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = h > 0 ? `${(s / h) * 100}%` : "0%";
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div id="nd-progress" aria-hidden><div id="nd-progress-bar" /></div>;
}
