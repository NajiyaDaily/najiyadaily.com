import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StickySubscribe } from "@/components/ui/StickySubscribe";
import { CookieNotice } from "@/components/ui/CookieNotice";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.najiyadaily.com";

export const viewport: Viewport = {
  themeColor: "#052962",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NajiyaDaily — Stories Worth Your Time",
    template: "%s | NajiyaDaily",
  },
  description: "Real news, travel guides, gadget reviews and Daily Paws — published daily from Sri Lanka.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "NajiyaDaily",
    locale: "en_US",
    url: SITE_URL,
    images: [{ url: SITE_URL + "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", site: "@NajiyaDaily" },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline dark mode script — runs before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){try{if(localStorage.getItem('nd-dark')==='1')document.documentElement.classList.add('dark')}catch(e){}})()`
        }}/>
        {/* Skimlinks */}
        <script async src="https://s.skimresources.com/js/307914X1796208.skimlinks.js"></script>
        {/* Booking.com */}
        <script async src="https://www.anrdoezrs.net/am/101867344/include/allCj/impressions/page/am.js"></script>
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
