import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#041f4a] text-white/65 mt-12 pt-10 pb-5">
      <div className="max-w-content mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-serif text-[1.7rem] font-black text-white mb-2">
              Najiya<span className="text-gold">Daily</span>
            </div>
            <p className="font-sans text-[12px] leading-relaxed max-w-[240px]">
              Real news, premium gadgets, global travel and Daily Paws — published daily from Sri Lanka.
            </p>
          </div>
          {[
            { heading: "Categories", links: [
              ["World","/category/world"],["Tech","/category/tech"],
              ["Culture","/category/culture"],["Travel","✈ /category/travel"],
              ["Daily Paws","🐾 /category/dailypaws"],
            ]},
            { heading: "Editions", links: [
              ["Morning — 8AM","/category/morning"],
              ["Travel — 11AM","/category/travel"],
              ["Daily Paws — 3PM","/category/dailypaws"],
              ["Afternoon — 1PM","/category/afternoon"],
              ["Evening — 7PM","/category/evening"],
            ]},
            { heading: "About", links: [
              ["About NajiyaDaily","/about"],
              ["Privacy Policy","/privacy"],
              ["Terms of Use","/terms"],
              ["Contact","mailto:najiyadaily11.11@gmail.com"],
            ]},
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="font-sans text-[9px] font-bold tracking-[2px] uppercase text-white/35
                             mb-3 pb-2 border-b border-white/10">
                {heading}
              </h4>
              {links.map(([label, href]) => (
                <Link key={label} href={href.replace(/^[^/]+ /,"")}
                  className="block font-sans text-[12.5px] text-white/55 mb-1.5 hover:text-white transition-colors">
                  {label.replace(/^[^ ]+ /,"")}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-sans text-[11px] text-white/25">© {year} NajiyaDaily</span>
          <div className="flex gap-4">
            {[["Privacy","/privacy"],["Terms","/terms"],["About","/about"]].map(([l,h]) => (
              <Link key={l} href={h}
                className="font-sans text-[11px] text-white/30 hover:text-white transition-colors">{l}</Link>
            ))}
          </div>
        </div>
        <p className="font-sans text-[10px] text-white/18 mt-2">
          Amazon Associate · Booking.com (101867344) · Skimlinks (307914X1796208) · No extra cost to you
        </p>
      </div>
    </footer>
  );
}
