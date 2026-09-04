# NajiyaDaily — Production Frontend

Live site: https://www.najiyadaily.com  
Stack: Next.js 14 · Supabase · Netlify · GitHub Actions · Claude AI

---

## Architecture

```
GitHub Actions (schedule 5x daily)
  → nd_publisher.py (generates article via Claude)
  → Supabase (stores article as draft)
  → Admin reviews at najiyadaily.com/admin
  → Publishes → live on homepage instantly
```

## Environment Variables (Netlify dashboard)

```
NEXT_PUBLIC_SITE_URL          = https://www.najiyadaily.com
NEXT_PUBLIC_SUPABASE_URL      = https://vnysdevtdowrrjoendrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key]
SUPABASE_SERVICE_ROLE_KEY     = [your service role key]
ADMIN_SECRET                  = [your admin password]
REVALIDATE_SECRET             = nd2026secret
NEXT_PUBLIC_BOOKING_PARTNER_ID = 101867344
NEXT_PUBLIC_AMAZON_TAG        = najiyadaily-20
```

## GitHub Secrets (repo Settings → Secrets → Actions)

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
REVALIDATE_SECRET
PEXELS_API_KEY
UNSPLASH_ACCESS_KEY
NEWS_API_KEY
```

## Publishing

**Manual:** GitHub → Actions → NajiyaDaily Manual Publisher → Run workflow → tick edition

**Auto schedule (Sri Lanka time):**
- 8:00 AM  → Morning edition
- 11:00 AM → Travel edition  
- 1:00 PM  → Afternoon edition
- 3:00 PM  → Daily Paws
- 7:00 PM  → Evening edition

**Admin dashboard:** najiyadaily.com/admin (password: ADMIN_SECRET env var)

## Local development

```bash
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

## Deploy

Push to GitHub → Netlify auto-deploys.
Articles publish to Supabase directly — no Netlify rebuild needed per article.
Commit messages include [skip ci] to preserve free build minutes.

## Monetisation

- Amazon Associates: najiyadaily-20
- Booking.com: partner ID 101867344  
- Skimlinks: 307914X1796208
- AdSense: apply after 25+ articles
- Journey by Mediavine: apply at 1,000 monthly sessions
