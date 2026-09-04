import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Terms of Use | NajiyaDaily" };
export default function Terms() {
  return (
    <div style={{ background:"#f7f6f2", minHeight:"100vh" }}>
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"48px 20px 80px" }}>
        <div style={{ marginBottom:"32px" }}>
          <Link href="/" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#a8a8b2" }}>← Back to NajiyaDaily</Link>
        </div>
        <h1 style={{ fontFamily:"var(--serif)", fontSize:"2.4rem", fontWeight:900, color:"#0d0d14", marginBottom:"8px" }}>Terms of Use</h1>
        <div style={{ width:"48px", height:"3px", background:"#d4af37", marginBottom:"8px" }}/>
        <p style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#a8a8b2", marginBottom:"28px" }}>Last updated: September 4, 2026</p>
        {[
          { h:"Acceptance of Terms", p:"By accessing najiyadaily.com you agree to these terms. If you do not agree, please do not use the site." },
          { h:"Content", p:"All articles published on NajiyaDaily are for informational purposes only. We strive for accuracy but make no warranties regarding completeness or timeliness of information. Content should not be taken as professional legal, financial, or medical advice." },
          { h:"Intellectual Property", p:"All content on NajiyaDaily — including articles, images, and design — is owned by NajiyaDaily or its licensors. You may not reproduce, distribute, or create derivative works without written permission." },
          { h:"Affiliate Disclosure", p:"NajiyaDaily participates in affiliate programmes including Amazon Associates and Booking.com. Articles containing affiliate links are clearly disclosed. We may earn a commission on qualifying purchases." },
          { h:"Third-Party Links", p:"NajiyaDaily may link to third-party websites. We are not responsible for the content or privacy practices of those sites." },
          { h:"Limitation of Liability", p:"NajiyaDaily is not liable for any damages arising from your use of this website or reliance on its content." },
          { h:"Changes", p:"We may update these terms at any time. Continued use of the site constitutes acceptance of updated terms." },
          { h:"Contact", p:"Terms enquiries: najiyadaily11.11@gmail.com" },
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
