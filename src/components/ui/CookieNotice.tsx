"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(function() {
    const t = setTimeout(function() {
      try { if (!localStorage.getItem("nd-cookie")) setShow(true); } catch(e) {}
    }, 2500);
    return function() { clearTimeout(t); };
  }, []);
  function accept() {
    try { localStorage.setItem("nd-cookie", "1"); } catch(e) {}
    setShow(false);
  }
  if (!show) return null;
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
                  background: "#041f4a", borderTop: "1px solid rgba(255,255,255,0.1)",
                  padding: "12px 20px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
      <p style={{ fontFamily: "sans-serif", fontSize: "12px",
                  color: "rgba(255,255,255,0.7)", flex: 1 }}>
        We use cookies to improve your experience. By reading NajiyaDaily you agree to our{" "}
        <Link href="/privacy" style={{ color: "#d4af37" }}>Privacy Policy</Link>.
      </p>
      <button onClick={accept}
        style={{ background: "#d4af37", color: "#052962", fontFamily: "sans-serif",
                 fontSize: "12px", fontWeight: 500, border: "none", borderRadius: "3px",
                 padding: "8px 20px", cursor: "pointer", whiteSpace: "nowrap" }}>
        Got it
      </button>
    </div>
  );
}
