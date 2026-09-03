"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { slug: "world",     label: "World",      className: "" },
  { slug: "tech",      label: "Tech",        className: "" },
  { slug: "culture",   label: "Culture",     className: "" },
  { slug: "science",   label: "Science",     className: "" },
  { slug: "music",     label: "Music",       className: "" },
  { slug: "opinion",   label: "Opinion",     className: "" },
  { slug: "travel",    label: "Travel",      className: "travel" },
  { slug: "dailypaws", label: "Daily Paws",  className: "paws" },
];

export function SiteHeader() {
  const [dark, setDark] = useState(false);
  const [time, setTime] = useState("--:--");

  useEffect(function() {
    try {
      setDark(localStorage.getItem("nd-dark") === "1");
    } catch(e) {}

    function tick() {
      const sl = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit",
      });
      setTime(sl);
    }
    tick();
    const id = setInterval(tick, 30000);
    return function() { clearInterval(id); };
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("nd-dark", next ? "1" : "0"); } catch(e) {}
  }

  return (
    <>
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e2de" }}>
        <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between" }}>
          <div style={{ padding: "14px 20px", borderRight: "1px solid #e2e2de",
                        display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "26px", fontWeight: 900,
                            color: "#052962", letterSpacing: "-1px", lineHeight: 1 }}>
                Najiya<span style={{ color: "#d4af37" }}>Daily</span>
              </div>
              <div style={{ fontFamily: "sans-serif", fontSize: "9px", letterSpacing: "2.5px",
                            textTransform: "uppercase", color: "#b0b0b8", marginTop: "3px" }}>
                Stories worth your time
              </div>
            </Link>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px 16px", borderBottom: "1px solid #e2e2de",
                          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "sans-serif", fontSize: "10px", color: "#7a7a85" }}>
                Colombo {time} SLT
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%",
                              background: "#1a9e5a" }}></div>
                <span style={{ fontFamily: "sans-serif", fontSize: "10px",
                               fontWeight: 500, color: "#3a3a42" }}>
                  Edition live
                </span>
              </div>
            </div>
            <nav style={{ display: "flex", overflowX: "auto", padding: "0 16px" }}>
              {NAV_ITEMS.map(function(item) {
                return (
                  <Link key={item.slug} href={"/category/" + item.slug}
                    style={{
                      fontFamily: "sans-serif", fontSize: "12px", fontWeight: 400,
                      color: item.className === "travel" ? "#0d6e5e"
                           : item.className === "paws"   ? "#a0195a"
                           : "#7a7a85",
                      padding: "11px 12px 11px 0", marginRight: "6px",
                      whiteSpace: "nowrap", borderBottom: "2px solid transparent",
                      display: "block", textDecoration: "none",
                    }}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div style={{ width: "140px", padding: "14px 16px", borderLeft: "1px solid #e2e2de",
                        display: "flex", flexDirection: "column", gap: "10px",
                        justifyContent: "center" }}>
            <button onClick={toggleDark}
              style={{ fontFamily: "sans-serif", fontSize: "11px", color: "#7a7a85",
                       background: "#f0efec", border: "none", borderRadius: "3px",
                       padding: "6px 10px", cursor: "pointer" }}>
              {dark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
