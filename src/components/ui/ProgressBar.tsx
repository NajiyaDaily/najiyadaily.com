"use client";
import { useEffect } from "react";
export function ProgressBar() {
  useEffect(function() {
    function update() {
      const bar = document.getElementById("nd-progress-bar");
      if (!bar) return;
      const s = document.documentElement.scrollTop;
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = h > 0 ? (s / h * 100) + "%" : "0%";
    }
    window.addEventListener("scroll", update, { passive: true });
    return function() { window.removeEventListener("scroll", update); };
  }, []);
  return (
    <div id="nd-progress" style={{ position: "fixed", top: 0, left: 0, right: 0,
                                    height: "3px", zIndex: 9999 }}>
      <div id="nd-progress-bar" style={{ height: "3px", background: "#052962",
                                          width: "0%" }} />
    </div>
  );
}
