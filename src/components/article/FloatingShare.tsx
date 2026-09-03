"use client";

export function FloatingShare({ url, title }: { url: string; title: string }) {
  const enc = (s: string) => encodeURIComponent(s);

  function handleCopy() {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(function() {});
    }
  }

  return (
    <div style={{ position: "sticky", top: "100px", float: "left",
                  marginLeft: "-56px", width: "40px",
                  display: "flex", flexDirection: "column", gap: "8px" }}>
      {[
        { label: "X",  href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}` },
        { label: "W",  href: `https://api.whatsapp.com/send?text=${enc(title + " " + url)}` },
        { label: "FB", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
      ].map(function(s) {
        return (
          <a key={s.label} href={s.href} target="_blank" rel="noopener"
            style={{ width: "40px", height: "40px", borderRadius: "50%",
                     background: "#fff", border: "1px solid #dcdcdc",
                     display: "flex", alignItems: "center", justifyContent: "center",
                     fontSize: "11px", color: "#3a3a42", textDecoration: "none" }}>
            {s.label}
          </a>
        );
      })}
      <button onClick={handleCopy}
        style={{ width: "40px", height: "40px", borderRadius: "50%",
                 background: "#fff", border: "1px solid #dcdcdc",
                 display: "flex", alignItems: "center", justifyContent: "center",
                 fontSize: "11px", color: "#3a3a42", cursor: "pointer" }}>
        &#128279;
      </button>
    </div>
  );
}
