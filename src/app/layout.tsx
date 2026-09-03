import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StickySubscribe } from "@/components/ui/StickySubscribe";
import { CookieNotice } from "@/components/ui/CookieNotice";
import { buildSiteJsonLd } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.najiyadaily.com";

export const viewport: Viewport = {
  themeColor: "#052962",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "NajiyaDaily — Stories Worth Your Time", template: "%s | NajiyaDaily" },
  description: "Real news, travel guides, gadget reviews and Daily Paws — published daily from Sri Lanka.",
  openGraph: {
    type: "website",
    siteName: "NajiyaDaily",
    locale: "en_US",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", site: "@NajiyaDaily" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteJsonLd = buildSiteJsonLd();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('nd-dark')==='1'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* Skimlinks */}
        <script
          async
          src="https://s.skimresources.com/js/307914X1796208.skimlinks.js"
          type="text/javascript"
        />
        {/* Booking.com */}
        <script
          async
          src="https://www.anrdoezrs.net/am/101867344/include/allCj/impressions/page/am.js"
        />
      </head>
      <body>
        <ProgressBar />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <StickySubscribe />
        <CookieNotice />
      </body>
    </html>
  );
}
