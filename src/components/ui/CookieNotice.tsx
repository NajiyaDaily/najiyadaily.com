"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!localStorage.getItem("nd-cookie")) setShow(true);
    }, 2500);
    return () => clearTimeout(t);
  }, []);
  const accept = () => {
    localStorage.setItem("nd-cookie", "1");
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#041f4a] border-t border-white/10
                    px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <p className="font-sans text-[12px] text-white/70 flex-1">
        We use cookies to improve your experience. By reading NajiyaDaily, you agree to our{" "}
        <Link href="/privacy" className="text-gold underline">Privacy Policy</Link>.
      </p>
      <button onClick={accept}
        className="bg-gold text-navy font-sans text-[12px] font-bold px-5 py-2 rounded-sm
                   hover:opacity-90 transition-opacity whitespace-nowrap">
        Got it
      </button>
    </div>
  );
}
