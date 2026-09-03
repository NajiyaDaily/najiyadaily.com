"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { slug: "world",     label: "World",      color: "#7a7a85" },
  { slug: "tech",      label: "Tech",        color: "#7a7a85" },
  { slug: "culture",   label: "Culture",     color: "#7a7a85" },
  { slug: "science",   label: "Science",     color: "#7a7a85" },
  { slug: "music",     label: "Music",       color: "#7a7a85" },
  { slug: "opinion",   label: "Opinion",     color: "#7a7a85" },
  { slug: "travel",    label: "Travel",      color: "#0d6e5e" },
  { slug: "dailypaws", label: "Daily Paws",  color: "#a0195a" },
];

export function SiteHeader() {
  const [dark, setDark] = useState(false);
  const [time, setTime] = useState("--:--");

  useEffect(function() {
    try { setDark(localStorage.getItem("nd-dark") === "1"); } catch(e) {}
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
    <header style={{ background: "#fff", borderBottom: "1px solid #e2e2de" }}>
      <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between" }}>

        {/* Logo block — navy background as per approved design */}
        <div style={{
          padding: "14px 20px",
          borderRight: "1px solid #e2e2de",
          display: "flex", flexDirection: "column", justifyContent: "center",
          background: "#052962",
          minWidth: "200px",
        }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "28px", fontWeight: 900,
              letterSpacing: "-1px", lineHeight: 1,
              display: "flex", alignItems: "baseline",
            }}>
              <span style={{ color: "#ffffff" }}>Najiya</span>
              <span style={{ color: "#d4af37" }}>Daily</span>
            </div>
            <div style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: "8px", letterSpacing: "2.5px",
              textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
              marginTop: "4px",
            }}>
              Stories Worth Your Time
            </div>
          </Link>
        </div>

        {/* Middle — date bar + nav */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: "8px 16px", borderBottom: "1px solid #e2e2de",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: "system-ui", fontSize: "10px", color: "#7a7a85", letterSpacing: ".3px" }}>
              Colombo {time} SLT
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a9e5a" }} />
              <span style={{ fontFamily: "system-ui", fontSize: "10px", fontWeight: 500, color: "#3a3a42" }}>
                Edition live
              </span>
            </div>
          </div>

          <nav style={{ display: "flex", overflowX: "auto", padding: "0 16px", alignItems: "center" }}>
            {NAV_ITEMS.map(function(item) {
              return (
                <Link key={item.slug}
                  href={"/category/" + item.slug}
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: "12px", fontWeight: item.color !== "#7a7a85" ? 500 : 400,
                    color: item.color,
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

        {/* Right — dark mode */}
        <div style={{
          width: "140px", padding: "14px 16px",
          borderLeft: "1px solid #e2e2de",
          display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            border: "1px solid #e2e2de", borderRadius: "4px",
            padding: "5px 8px", background: "#f0efec",
          }}>
            <span style={{ fontFamily: "system-ui", fontSize: "10px", color: "#b0b0b8" }}>Search</span>
          </div>
          <button onClick={toggleDark} style={{
            fontFamily: "system-ui", fontSize: "10px", color: "#7a7a85",
            background: "#f0efec", border: "none", borderRadius: "3px",
            padding: "5px 8px", cursor: "pointer", textAlign: "center",
          }}>
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>

      </div>
    </header>
  );
}
