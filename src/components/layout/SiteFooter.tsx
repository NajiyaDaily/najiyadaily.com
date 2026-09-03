import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: "#111118", padding: "24px 20px 16px", color: "rgba(255,255,255,0.5)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "20px", marginBottom: "16px" }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: 900,
                        color: "#fff", marginBottom: "6px" }}>
            Najiya<span style={{ color: "#d4af37" }}>Daily</span>
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: "11px", lineHeight: 1.6,
                      color: "rgba(255,255,255,0.4)", maxWidth: "200px" }}>
            Independent editorial journalism published daily from Sri Lanka.
          </p>
        </div>
        <div>
          <h4 style={{ fontFamily: "sans-serif", fontSize: "9px", fontWeight: 500,
                       letterSpacing: "2px", textTransform: "uppercase",
                       color: "rgba(255,255,255,0.25)", marginBottom: "10px",
                       paddingBottom: "6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Sections
          </h4>
          {["World","Tech","Culture","Travel","Daily Paws"].map(function(item) {
            return (
              <Link key={item} href={"/category/" + item.toLowerCase().replace(" ","")}
                style={{ display: "block", fontFamily: "sans-serif", fontSize: "11px",
                         color: "rgba(255,255,255,0.45)", marginBottom: "5px",
                         textDecoration: "none" }}>
                {item}
              </Link>
            );
          })}
        </div>
        <div>
          <h4 style={{ fontFamily: "sans-serif", fontSize: "9px", fontWeight: 500,
                       letterSpacing: "2px", textTransform: "uppercase",
                       color: "rgba(255,255,255,0.25)", marginBottom: "10px",
                       paddingBottom: "6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Site
          </h4>
          {[["About","/about"],["Privacy","/privacy"],["Terms","/terms"],
            ["Contact","mailto:najiyadaily11.11@gmail.com"]].map(function(item) {
            return (
              <Link key={item[0]} href={item[1]}
                style={{ display: "block", fontFamily: "sans-serif", fontSize: "11px",
                         color: "rgba(255,255,255,0.45)", marginBottom: "5px",
                         textDecoration: "none" }}>
                {item[0]}
              </Link>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px",
                    display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
        <span style={{ fontFamily: "sans-serif", fontSize: "10px",
                       color: "rgba(255,255,255,0.2)" }}>
          {year} NajiyaDaily
        </span>
      </div>
      <p style={{ fontFamily: "sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.15)",
                  marginTop: "6px" }}>
        Amazon Associate · Booking.com 101867344 · Skimlinks 307914X1796208
      </p>
    </footer>
  );
}
