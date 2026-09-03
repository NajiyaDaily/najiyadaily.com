"use client";
import { useEffect, useState } from "react";
export function StickySubscribe() {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed]   = useState(false);
  useEffect(function() {
    try { if (sessionStorage.getItem("nd-sub-closed")) { setClosed(true); return; } } catch(e) {}
    function onScroll() {
      const s = document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (h > 0 && s / h > 0.4) setVisible(true);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return function() { window.removeEventListener("scroll", onScroll); };
  }, []);
  function dismiss() {
    setClosed(true);
    try { sessionStorage.setItem("nd-sub-closed", "1"); } catch(e) {}
  }
  if (closed || !visible) return null;
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
                  background: "#041f4a", borderTop: "2px solid #d4af37",
                  padding: "12px 20px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
        <strong style={{ color: "#fff" }}>Never miss a story.</strong> Get NajiyaDaily free.
      </p>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input type="email" placeholder="your@email.com"
          style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)",
                   color: "#fff", fontFamily: "sans-serif", fontSize: "12px",
                   padding: "7px 10px", borderRadius: "3px", width: "180px" }} />
        <button onClick={function() { window.open("https://feedburner.google.com/fb/a/mailverify?uri=NajiyaDaily&loc=en_US","_blank"); }}
          style={{ background: "#d4af37", color: "#052962", fontFamily: "sans-serif",
                   fontSize: "11px", fontWeight: 500, border: "none", borderRadius: "3px",
                   padding: "7px 14px", cursor: "pointer" }}>
          Subscribe
        </button>
        <button onClick={dismiss}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)",
                   fontSize: "20px", cursor: "pointer", padding: "0 4px" }}>
          x
        </button>
      </div>
    </div>
  );
}
