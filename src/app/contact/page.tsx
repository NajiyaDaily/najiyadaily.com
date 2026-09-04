import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Contact | NajiyaDaily" };
export default function Contact() {
  return (
    <div style={{ background:"#f7f6f2", minHeight:"100vh" }}>
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"48px 20px 80px" }}>
        <div style={{ marginBottom:"32px" }}>
          <Link href="/" style={{ fontFamily:"var(--sans)", fontSize:"11px", color:"#a8a8b2" }}>← Back to NajiyaDaily</Link>
        </div>
        <h1 style={{ fontFamily:"var(--serif)", fontSize:"2.4rem", fontWeight:900, color:"#0d0d14", marginBottom:"8px" }}>Contact</h1>
        <div style={{ width:"48px", height:"3px", background:"#d4af37", marginBottom:"28px" }}/>
        <p style={{ fontFamily:"var(--sans)", fontSize:"1rem", lineHeight:1.85, color:"#3a3a42", marginBottom:"28px" }}>
          We'd love to hear from you. Whether it's a story tip, a correction, a partnership enquiry, or just a note — reach us at the address below.
        </p>
        {[
          { label:"Editorial & General", email:"najiyadaily11.11@gmail.com" },
          { label:"Corrections & Feedback", email:"najiyadaily11.11@gmail.com" },
          { label:"Advertising & Partnerships", email:"najiyadaily11.11@gmail.com" },
        ].map(({ label, email }) => (
          <div key={label} style={{ border:"1px solid #dedbd4", borderRadius:"6px", padding:"18px 20px", background:"#fff", marginBottom:"14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px" }}>
            <div>
              <div style={{ fontFamily:"var(--sans)", fontSize:"10px", fontWeight:600, letterSpacing:"1px", textTransform:"uppercase", color:"#a8a8b2", marginBottom:"4px" }}>{label}</div>
              <a href={"mailto:"+email} style={{ fontFamily:"var(--sans)", fontSize:"14px", fontWeight:500, color:"#052962" }}>{email}</a>
            </div>
          </div>
        ))}
        <p style={{ fontFamily:"var(--sans)", fontSize:"12px", color:"#a8a8b2", marginTop:"24px" }}>
          We are based in Colombo, Sri Lanka and typically respond within 48 hours.
        </p>
      </div>
    </div>
  );
}
