"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { slug:"world",     label:"World",     color:"" },
  { slug:"tech",      label:"Tech",      color:"" },
  { slug:"culture",   label:"Culture",   color:"" },
  { slug:"science",   label:"Science",   color:"" },
  { slug:"music",     label:"Music",     color:"" },
  { slug:"opinion",   label:"Opinion",   color:"" },
  { slug:"travel",    label:"Travel",    color:"#0d6e5e" },
  { slug:"dailypaws", label:"Daily Paws",color:"#a0195a" },
];

export function SiteHeader() {
  const [dark, setDark]     = useState(false);
  const [time, setTime]     = useState("--:--");
  const [edition, setEd]    = useState("Loading edition...");
  const [scrolled, setScr]  = useState(false);

  useEffect(() => {
    try { setDark(localStorage.getItem("nd-dark") === "1"); } catch {}

    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US",
        { timeZone:"Asia/Colombo", hour:"2-digit", minute:"2-digit" }));
      // Edition indicator based on SLT time
      const h = parseInt(now.toLocaleTimeString("en-US",
        { timeZone:"Asia/Colombo", hour:"2-digit", hour12:false }));
      if      (h >= 19) setEd("Evening edition");
      else if (h >= 15) setEd("Daily Paws live");
      else if (h >= 13) setEd("Afternoon edition");
      else if (h >= 11) setEd("Travel edition");
      else if (h >= 8)  setEd("Morning edition");
      else              setEd("Next edition at 8AM");
    };
    tick();
    const id = setInterval(tick, 30000);

    const onScroll = () => setScr(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => { clearInterval(id); window.removeEventListener("scroll", onScroll); };
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("nd-dark", next ? "1" : "0"); } catch {}
  };

  return (
    <header style={{
      background:"#fff",
      borderBottom: scrolled ? "1px solid #dedbd4" : "1px solid #dedbd4",
      boxShadow: scrolled ? "0 2px 16px rgba(5,41,98,.08)" : "none",
      position:"sticky", top:0, zIndex:100,
      transition:"box-shadow .2s",
    }}>
      <div style={{ display:"flex", alignItems:"stretch" }}>

        {/* Logo block */}
        <div style={{
          background:"#052962",
          padding:"0 22px",
          display:"flex", flexDirection:"column", justifyContent:"center",
          minWidth:"180px", borderRight:"none",
        }}>
          <Link href="/" style={{ textDecoration:"none", display:"block" }}>
            {/* Logo */}
            <div style={{
              fontFamily:"'Playfair Display', Georgia, serif",
              fontSize:"26px", fontWeight:900,
              lineHeight:1, letterSpacing:"-1px",
            }}>
              <span style={{ color:"#fff" }}>Najiya</span>
              <span style={{ color:"#d4af37" }}>Daily</span>
            </div>
            {/* Gold rule */}
            <div style={{ height:"2px", background:"#d4af37",
              margin:"4px 0", width:"100%" }} />
            {/* Tagline */}
            <div style={{
              fontFamily:"'DM Sans', system-ui, sans-serif",
              fontSize:"8px", letterSpacing:"2.5px",
              textTransform:"uppercase",
              color:"rgba(255,255,255,.4)",
            }}>
              Stories Worth Your Time
            </div>
          </Link>
        </div>

        {/* Centre — date bar + nav */}
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {/* Top bar */}
          <div style={{
            padding:"5px 18px",
            borderBottom:"1px solid #eceae5",
            display:"flex", alignItems:"center",
            justifyContent:"space-between",
            background:"#fafaf8",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
              <span style={{ fontFamily:"var(--sans)", fontSize:"10px",
                color:"#a8a8b2" }}>
                Colombo · {time} SLT
              </span>
              <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                <div style={{ width:"5px", height:"5px", borderRadius:"50%",
                  background:"#1a9e5a",
                  boxShadow:"0 0 0 2px rgba(26,158,90,.2)" }} />
                <span style={{ fontFamily:"var(--sans)", fontSize:"10px",
                  fontWeight:500, color:"#3a3a42" }}>
                  {edition}
                </span>
              </div>
            </div>
            <button onClick={toggleDark} style={{
              fontFamily:"var(--sans)", fontSize:"10px",
              color:"#a8a8b2", background:"none", border:"none",
              cursor:"pointer", padding:"2px 6px",
            }}>
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>
          </div>

          {/* Navigation */}
          <nav style={{
            display:"flex", alignItems:"center",
            padding:"0 18px", overflowX:"auto",
            gap:0,
          }}>
            {NAV.map(item => (
              <Link key={item.slug}
                href={`/category/${item.slug}`}
                style={{
                  fontFamily:"var(--sans)", fontSize:"12.5px",
                  fontWeight: item.color ? 600 : 400,
                  color: item.color || "#6b6b78",
                  padding:"12px 12px 12px 0",
                  marginRight:"8px",
                  whiteSpace:"nowrap",
                  borderBottom:"2px solid transparent",
                  display:"block",
                  transition:"color .15s, border-color .15s",
                  textDecoration:"none",
                }}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right actions */}
        <div style={{
          width:"130px", flexShrink:0,
          borderLeft:"1px solid #eceae5",
          display:"flex", flexDirection:"column",
          justifyContent:"center", gap:"8px",
          padding:"12px 14px",
        }}>
          <Link href="/search" style={{
            fontFamily:"var(--sans)", fontSize:"11px",
            color:"#6b6b78", display:"flex", alignItems:"center",
            gap:"5px", textDecoration:"none",
            border:"1px solid #eceae5", borderRadius:"3px",
            padding:"5px 8px", background:"#fafaf8",
          }}>
            <span>🔍</span> Search
          </Link>
          <Link href="/admin" style={{
            fontFamily:"var(--sans)", fontSize:"10px",
            color:"#a8a8b2", textAlign:"center",
            textDecoration:"none",
          }}>
            Admin ›
          </Link>
        </div>
      </div>
    </header>
  );
}
