"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV_CATEGORIES } from "@/lib/categories";
import { getCategoryMeta } from "@/lib/categories";

const SITE_URL = "https://www.najiyadaily.com";

export function SiteHeader() {
  const [dark, setDark] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    setDark(localStorage.getItem("nd-dark") === "1");
    const tick = () => {
      const sl = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit"
      });
      setTime(sl);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nd-dark", next ? "1" : "0");
  };

  return (
    <>
      {/* Ticker */}
      <div className="bg-[#041f4a] overflow-hidden py-1.5 relative">
        <span className="absolute left-0 top-0 bottom-0 bg-gold text-navy text-[9px] font-bold tracking-widest uppercase px-3 flex items-center z-10 whitespace-nowrap">
          LIVE
        </span>
        <div className="flex whitespace-nowrap animate-[ticker_50s_linear_infinite] pl-16">
          {["Real news every day · Morning · Afternoon · Evening",
            "Travel: Daily destination guides with curated hotel picks",
            "Daily Paws: Stories and love for your fur babies",
            "Premium gadget reviews with global buyer sentiment",
          ].concat([
            "Real news every day · Morning · Afternoon · Evening",
            "Travel: Daily destination guides with curated hotel picks",
            "Daily Paws: Stories and love for your fur babies",
            "Premium gadget reviews with global buyer sentiment",
          ]).map((t, i) => (
            <span key={i} className="text-white/65 text-[11px] font-sans px-7">
              ● {t}
            </span>
          ))}
        </div>
      </div>

      {/* Main header */}
      <header className="bg-navy border-b-4 border-gold sticky top-0 z-50">
        {/* Top row */}
        <div className="max-w-content mx-auto px-5 flex items-end justify-between py-3 border-b border-white/10">
          <Link href="/" className="block">
            <div className="font-serif text-[2.4rem] font-black text-white leading-none tracking-tight">
              Najiya<span className="text-gold">Daily</span>
            </div>
            <div className="font-sans text-[9px] font-normal tracking-[3px] uppercase text-white/40 mt-0.5">
              Stories Worth Your Time
            </div>
          </Link>
          <div className="flex items-center gap-4 pb-1">
            <div className="text-right font-sans text-xs text-white/50 hidden md:block">
              <div>Sri Lanka · {time}</div>
              <Link href={`mailto:najiyadaily11.11@gmail.com`} className="text-white/40 hover:text-white/70 transition-colors text-[11px]">
                Contact us
              </Link>
            </div>
            <button
              onClick={toggleDark}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-content-center transition-colors text-base"
              aria-label="Toggle dark mode"
            >
              {dark ? "☀" : "🌙"}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="max-w-content mx-auto px-5 flex items-stretch overflow-x-auto scrollbar-none">
          {NAV_CATEGORIES.map((cat) => {
            const meta = getCategoryMeta(cat);
            const isTravel = cat === "Travel";
            const isPaws   = cat === "Daily-Paws";
            return (
              <Link
                key={cat}
                href={`/category/${cat.toLowerCase().replace("-","")}`}
                className="font-sans text-[14px] font-bold py-2.5 pr-4 mr-1 border-b-[3px] border-transparent
                           hover:border-gold hover:text-white transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  color: isTravel ? "#6dd5cf" : isPaws ? "#f9aace" : "rgba(255,255,255,0.75)"
                }}
              >
                {meta.emoji ? `${meta.emoji} ` : ""}{meta.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            className="ml-auto flex items-center font-sans text-[12px] text-white/60 hover:text-white
                       border border-white/20 hover:border-white/40 rounded px-3 my-2 transition-all whitespace-nowrap"
          >
            🔍 Search
          </Link>
        </nav>
      </header>
    </>
  );
}
