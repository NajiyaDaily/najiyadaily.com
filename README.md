# NajiyaDaily — Next.js Frontend

Production frontend for https://www.najiyadaily.com
Content sourced from Blogger API (Blog ID: 6392874604663604321)

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in .env.local with your keys
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com → Import Project → select repo
3. Add environment variables in Vercel dashboard:
   - `BLOGGER_API_KEY` — from Google Cloud Console
   - `BLOGGER_BLOG_ID` — 6392874604663604321
   - `NEXT_PUBLIC_SITE_URL` — https://www.najiyadaily.com
   - `NEXT_PUBLIC_BOOKING_PARTNER_ID` — 101867344
   - `NEXT_PUBLIC_AMAZON_TAG` — najiyadaily-20
   - `REVALIDATE_SECRET` — any random string
4. Set custom domain: www.najiyadaily.com

## Connect domain (Namecheap → Vercel)

In Namecheap DNS, REPLACE the Blogger CNAME records with:
- CNAME: www → cname.vercel-dns.com
- A: @ → 76.76.21.21

In Vercel → Project → Settings → Domains → add www.najiyadaily.com

## On-demand revalidation (after GitHub Actions publish)

Add to GitHub Actions workflows after publish step:
```yaml
- name: Revalidate site
  run: |
    curl -X POST "https://www.najiyadaily.com/api/revalidate?secret=${{ secrets.REVALIDATE_SECRET }}"
```

## File structure

```
src/
  app/
    page.tsx              # Homepage — Guardian grid
    layout.tsx            # Root layout — header/footer/meta
    sitemap.ts            # Auto-generated XML sitemap
    robots.ts             # robots.txt
    posts/[slug]/page.tsx # Article pages with all 7 components
    category/[slug]/page.tsx # Category listing pages
    api/revalidate/route.ts  # ISR revalidation webhook
  components/
    layout/SiteHeader.tsx    # Nav, ticker, dark mode
    layout/SiteFooter.tsx    # Footer, legal, affiliates
    article/FloatingShare.tsx # Sticky share buttons
    article/RelatedArticles.tsx # 3-col related posts
    ui/ProgressBar.tsx       # Reading progress bar
    ui/StickySubscribe.tsx   # Email capture at 40% scroll
    ui/CookieNotice.tsx      # GDPR cookie notice
  lib/
    blogger.ts           # Blogger API v3 + JSON feed ingestion
    article-parser.ts    # Extracts NajiyaDaily signature components
    categories.ts        # Category config, colours, nav
    seo.ts               # Meta, JSON-LD, breadcrumbs
  types/index.ts         # TypeScript interfaces
```
