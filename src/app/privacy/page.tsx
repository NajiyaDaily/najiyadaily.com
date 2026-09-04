import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Privacy Policy | NajiyaDaily" };
export default function Privacy() {
  return (
    <div style={{ background:"#f7f6f2", minHeight:"100vh" }}>
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"48px 20px 80px" }}>
        <div style={{ marginBottom:"32px" }}>
          <Link href="/" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#a8a8b2" }}>← Back to NajiyaDaily</Link>
        </div>
        <h1 style={{ fontFamily:"var(--serif)", fontSize:"2.4rem", fontWeight:900, color:"#0d0d14", marginBottom:"8px" }}>Privacy Policy</h1>
        <div style={{ width:"48px", height:"3px", background:"#d4af37", marginBottom:"8px" }}/>
        <p style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#a8a8b2", marginBottom:"28px" }}>Last updated: September 4, 2026</p>
        {[
          { h:"Information We Collect", p:"NajiyaDaily collects minimal data. If you subscribe to our newsletter, we store your email address to send you daily digests. We do not sell, rent, or share your email with third parties." },
          { h:"Cookies", p:"We use essential cookies to remember your dark mode preference. We also use third-party scripts including Skimlinks (affiliate tracking), Booking.com (travel affiliate), and Google Analytics (anonymous traffic analysis). These services may set their own cookies." },
          { h:"Affiliate Links", p:"Some articles contain affiliate links to Amazon (tag: najiyadaily-20) and Booking.com (ID: 101867344). If you make a purchase through these links, we may earn a small commission at no additional cost to you. These are always disclosed within the article." },
          { h:"Data Storage", p:"Email subscriptions are processed via third-party email services. We do not store payment information. Article data is stored on Supabase, a secure cloud database." },
          { h:"Your Rights", p:"You may request deletion of your data at any time by emailing najiyadaily11.11@gmail.com. We will respond within 30 days." },
          { h:"Contact", p:"For privacy enquiries: najiyadaily11.11@gmail.com" },
        ].map(({ h, p }) => (
          <div key={h} style={{ marginBottom:"24px" }}>
            <h2 style={{ fontFamily:"var(--serif)", fontSize:"1.2rem", fontWeight:700, color:"#0d0d14", marginBottom:"10px", paddingLeft:"14px", borderLeft:"3px solid #d4af37" }}>{h}</h2>
            <p style={{ fontFamily:"var(--sans)", fontSize:"1rem", lineHeight:1.85, color:"#3a3a42" }}>{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
