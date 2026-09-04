import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "About NajiyaDaily" };
export default function About() {
  return (
    <div style={{ background:"#f7f6f2", minHeight:"100vh" }}>
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"48px 20px 80px" }}>
        <div style={{ marginBottom:"32px" }}>
          <Link href="/" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#a8a8b2" }}>← Back to NajiyaDaily</Link>
        </div>
        <h1 style={{ fontFamily:"var(--serif)", fontSize:"2.4rem", fontWeight:900, color:"#0d0d14", marginBottom:"8px" }}>About NajiyaDaily</h1>
        <div style={{ width:"48px", height:"3px", background:"#d4af37", marginBottom:"28px" }}/>
        <p style={{ fontFamily:"var(--sans)", fontSize:"1rem", lineHeight:1.85, color:"#3a3a42", marginBottom:"20px" }}>
          NajiyaDaily is an independent digital publication based in Sri Lanka, delivering real news, travel guides, gadget reviews, and Daily Paws — stories about the pets we love — every single day.
        </p>
        <p style={{ fontFamily:"var(--sans)", fontSize:"1rem", lineHeight:1.85, color:"#3a3a42", marginBottom:"20px" }}>
          We publish five editions daily — Morning, Travel, Afternoon, Daily Paws, and Evening — covering World News, Technology, Culture, Science, Music, Opinion, and Pet Care.
        </p>
        <p style={{ fontFamily:"var(--sans)", fontSize:"1rem", lineHeight:1.85, color:"#3a3a42", marginBottom:"20px" }}>
          Our editorial process combines AI-assisted research with human review to ensure accuracy, fairness, and depth in every piece we publish.
        </p>
        <h2 style={{ fontFamily:"var(--serif)", fontSize:"1.4rem", fontWeight:700, color:"#0d0d14", margin:"32px 0 12px", paddingLeft:"14px", borderLeft:"3px solid #d4af37" }}>Editorial Standards</h2>
        <p style={{ fontFamily:"var(--sans)", fontSize:"1rem", lineHeight:1.85, color:"#3a3a42", marginBottom:"20px" }}>
          Every article is fact-checked before publication. We clearly disclose affiliate relationships and never allow commercial arrangements to influence editorial content. Our travel and gadget coverage may contain affiliate links — these are always disclosed and cost the reader nothing extra.
        </p>
        <h2 style={{ fontFamily:"var(--serif)", fontSize:"1.4rem", fontWeight:700, color:"#0d0d14", margin:"32px 0 12px", paddingLeft:"14px", borderLeft:"3px solid #d4af37" }}>Contact</h2>
        <p style={{ fontFamily:"var(--sans)", fontSize:"1rem", lineHeight:1.85, color:"#3a3a42" }}>
          Editorial: <a href="mailto:najiyadaily11.11@gmail.com" style={{ color:"#052962" }}>najiyadaily11.11@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
