"""
NajiyaDaily Publisher — posts directly to najiyadaily.com
Generates article via Claude → writes Markdown to /content/
→ registers in Supabase → Netlify auto-deploys
"""
import os
import re
import json
import time
import datetime
import requests
import anthropic

SITE_URL        = os.environ.get("SITE_URL", "https://najiyadaily.com")
EDITION         = os.environ.get("EDITION", "morning")
SUPABASE_URL    = os.environ["SUPABASE_URL"]
SUPABASE_KEY    = os.environ["SUPABASE_SERVICE_KEY"]
REVALIDATE      = os.environ.get("REVALIDATE_SECRET", "")
ANTHROPIC_KEY   = os.environ["ANTHROPIC_API_KEY"]
PEXELS_KEY      = os.environ.get("PEXELS_API_KEY", "")
UNSPLASH_KEY    = os.environ.get("UNSPLASH_ACCESS_KEY", "")
NEWS_API_KEY    = os.environ.get("NEWS_API_KEY", "")
AMAZON_TAG      = os.environ.get("AMAZON_AFFILIATE_TAG", "najiyadaily-20")

# Stable pinned model string to avoid 404 alias issues
CLAUDE_MODEL    = "claude-3-5-sonnet-20241022"

client = anthropic.Anthropic(api_key=ANTHROPIC_KEY, max_retries=5)

SUPABASE_HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

PUBLISH_LOG = "scripts/publish_log.json"

# ── Publish log ───────────────────────────────────────────────────
def load_log():
    try:
        return json.load(open(PUBLISH_LOG)) if os.path.exists(PUBLISH_LOG) else {}
    except Exception:
        return {}

def save_log(log):
    log["images"]    = log.get("images",    [])[-100:]
    log["headlines"] = log.get("headlines", [])[-50:]
    json.dump(log, open(PUBLISH_LOG, "w"), indent=2)

# ── Image fetch ───────────────────────────────────────────────────
def get_image(query: str, log: dict) -> tuple[str, str]:
    if not UNSPLASH_KEY:
        return "", ""
    try:
        r = requests.get(
            "https://api.unsplash.com/search/photos",
            headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"},
            params={"query": query, "per_page": 5, "orientation": "landscape", "content_filter": "high"},
            timeout=10
        )
        results = r.json().get("results", [])
        used    = log.get("images", [])
        photo   = next((p for p in results if p["urls"]["regular"] not in used), results[0] if results else None)
        if not photo:
            return "", ""
        url     = photo["urls"]["regular"]
        user    = photo["user"]["name"]
        credit  = f"Photo by {user} on Unsplash"
        return url, credit
    except Exception as e:
        print(f"Image fetch error: {e}")
        return "", ""

# ── News topics ───────────────────────────────────────────────────
def get_news_topic() -> str:
    if not NEWS_API_KEY:
        return "global technology innovation 2026"
    try:
        r = requests.get(
            "https://newsapi.org/v2/top-headlines",
            params={"apiKey": NEWS_API_KEY, "language": "en", "pageSize": 10},
            timeout=10
        )
        articles = r.json().get("articles", [])
        if articles:
            return articles[0].get("title", "global news today")
    except Exception:
        pass
    return "global technology innovation 2026"

# ── Slug builder ──────────────────────────────────────────────────
def make_slug(title: str) -> str:
    slug = re.sub(r"[^a-z0-9\s-]", "", title.lower())
    slug = re.sub(r"\s+", "-", slug.strip())
    slug = re.sub(r"-+", "-", slug)
    ts   = datetime.datetime.now().strftime("%Y%m%d%H%M")
    return f"{slug[:60]}-{ts}"

# ── Word count ────────────────────────────────────────────────────
def word_count(text: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", text).split())

# ── Edition configurations ────────────────────────────────────────
EDITION_CONFIG = {
    "morning":    {"category": "World",      "labels": ["World", "Morning"],     "time": "8:00 AM"},
    "travel":     {"category": "Travel",     "labels": ["Travel"],               "time": "11:00 AM"},
    "afternoon":  {"category": "World",      "labels": ["World", "Afternoon"],   "time": "1:00 PM"},
    "daily_paws": {"category": "Daily-Paws", "labels": ["Daily-Paws"],           "time": "3:00 PM"},
    "evening":    {"category": "World",      "labels": ["World", "Evening"],     "time": "7:00 PM"},
    "gadget":     {"category": "Gadgets",    "labels": ["Gadgets", "Review"],    "time": "manual"},
}

PAWS_ROTATION = {
    0: "Dog Spotlight", 1: "Cat Spotlight", 2: "Pet Health",
    3: "Heroic Tales",  4: "Love & Loss",   5: "Training & Tips", 6: "Pet Travel"
}

def safe_json_parse(text: str) -> dict:
    """
    Robustly parse JSON from Claude output.
    Handles markdown fences, trailing commas, single quotes, and reformats via model fallback if required.
    """
    import ast

    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()

    start = text.find("{")
    end   = text.rfind("}")
    if start >= 0 and end >= 0:
        text = text[start:end+1]

    # Clean potential trailing commas
    text = re.sub(r",\s*([}\]])", r"\1", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    try:
        result = ast.literal_eval(text)
        if isinstance(result, dict):
            return result
    except Exception:
        pass

    # Fallback retry request if malformed
    print("Warning: Initial JSON parse failed, requesting cleaned format...")
    retry = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=3000,
        messages=[
            {
                "role": "user",
                "content": f"Return ONLY valid standard JSON (RFC 8259) parsing this object. No commentary, no code fences:\n\n{text}"
            }
        ]
    )
    retry_text = retry.content[0].text.strip()
    retry_text = re.sub(r"^```(?:json)?\s*", "", retry_text)
    retry_text = re.sub(r"\s*```\s*$", "", retry_text)

    start = retry_text.find("{")
    end   = retry_text.rfind("}")
    if start >= 0 and end >= 0:
        retry_text = retry_text[start:end+1]

    retry_text = re.sub(r",\s*([}\]])", r"\1", retry_text)
    return json.loads(retry_text)


def generate_article(edition: str, topic: str, log: dict) -> dict:
    cfg   = EDITION_CONFIG.get(edition, EDITION_CONFIG["morning"])
    today = datetime.datetime.now().strftime("%B %d, %Y")
    recent_headlines = log.get("headlines", [])[-10:]
    avoid = "\n".join(f"- {h}" for h in recent_headlines) if recent_headlines else "None yet."

    if edition == "daily_paws":
        dow   = datetime.datetime.now().weekday()
        ptype = PAWS_ROTATION.get(dow, "Dog Spotlight")
        prompt = f"""You are the warm, passionate writer behind NajiyaDaily's Daily Paws.
Today is {today}. Write a Daily Paws article: {ptype}

RECENT HEADLINES TO AVOID REPEATING:
{avoid}

NajiyaDaily VOICE — Daily Paws edition:
- Never say "dog" or "cat" alone — always: fur baby, four-legged friend, furball, loyal companion
- Minimum 2 pet puns per article
- 1 famous pet quote
- Warm vocabulary: beloved, darling, cherished, adored
- 700+ words of genuine warmth and information

Output ONLY valid JSON:
{{"headline":"Creative warm headline with pet pun",
"standfirst":"One warm italic sentence that draws the reader in",
"category":"Daily-Paws",
"labels":["Daily-Paws"],
"explains":"2 sentences of background context",
"why_matters":"1 sentence on why pet owners need this",
"takeaways":["point 1","point 2","point 3"],
"whats_next":["watch for 1","watch for 2","watch for 3"],
"image_query":"specific adorable pet photo 4-5 words",
"body_html":"<p>...</p><h3>...</h3><p>...</p>800+ words warm HTML"}}"""

    elif edition == "travel":
        prompt = f"""You are NajiyaDaily's travel editor. Today: {today}.
Write a destination travel guide — pick one city or destination making news or trending now.

RECENT HEADLINES TO AVOID:
{avoid}

NAJIYADAILY TRAVEL VOICE:
- Sensory, specific — the one detail that makes this city different
- Practical + inspirational — readers can actually use this
- Booking.com affiliate angle: recommend 2-3 hotels naturally in the text
- Add Booking.com link: https://www.booking.com/city/CITYCODE/CITYNAME.html?aid=101867344

Output ONLY valid JSON:
{{"headline":"Evocative travel headline — poetic, specific, 12-15 words",
"standfirst":"One sentence that makes the reader feel they're already there",
"category":"Travel",
"labels":["Travel"],
"explains":"2 sentences of destination context",
"why_matters":"1 sentence on why visit now",
"takeaways":["tip 1","tip 2","tip 3"],
"whats_next":["when to go","what to book","what to pack"],
"image_query":"stunning destination city landscape 4-5 words",
"body_html":"<p>...</p><h3>...</h3>800+ words HTML with hotel recommendations and Booking.com links"}}"""

    else:
        prompt = f"""You are a senior journalist at NajiyaDaily. Today: {today}.
Write the {edition} edition based on this real news topic: {topic}

RECENT HEADLINES TO AVOID:
{avoid}

NAJIYADAILY EDITORIAL VOICE:
- Written like a brilliant, informed friend — warm, sharp, never condescending
- Connects global events to everyday life — what does this mean for real people?
- Always has a point of view — direct, analytical, never neutral to the point of uselessness
- Open with the ONE most important fact in 2 sentences
- Include "What Happens Next" — 3 specific things to watch

Output ONLY valid JSON:
{{"headline":"Unique 12-15 word headline — different angle from all recent ones above",
"standfirst":"One compelling italic sentence giving essential context",
"category":"{cfg['category']}",
"labels":{json.dumps(cfg['labels'])},
"explains":"2 sentences of background context the general reader needs",
"why_matters":"1 sentence on the real human impact",
"takeaways":["key point 1","key point 2","key point 3"],
"whats_next":["specific thing to watch 1","specific thing to watch 2","specific thing to watch 3"],
"image_query":"editorial news photo 4-5 specific words",
"body_html":"<p>...</p><h3>...</h3>800+ words HTML"}}"""

    # Retry up to 5 times with backoff for 529 overload / 429 rate limit
    last_err = None
    for attempt in range(5):
        try:
            msg = client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}]
            )
            text = msg.content[0].text.strip()
            return safe_json_parse(text)
        except Exception as e:
            last_err = e
            err_str = str(e).lower()
            if any(term in err_str for term in ["529", "overloaded", "rate_limit", "429", "connection", "timeout"]):
                wait = (2 ** attempt) * 4 + 5  # 9s, 13s, 21s, 37s, 69s
                print(f"Attempt {attempt + 1} failed ({str(e)[:60]}). Retrying in {wait}s...")
                time.sleep(wait)
                continue
            raise e
    raise last_err

# ── Write Markdown file ───────────────────────────────────────────
def write_markdown(article: dict, slug: str, img_url: str, img_credit: str):
    cat_dir = os.path.join("content", article["category"].lower().replace("-", ""))
    os.makedirs(cat_dir, exist_ok=True)

    # Escape backslashes and double quotes properly for YAML frontmatter
    def yaml_escape(val: str) -> str:
        return str(val).replace('\\', '\\\\').replace('"', r'\"')

    title      = yaml_escape(article.get("headline", ""))
    standfirst = yaml_escape(article.get("standfirst", ""))
    category   = article["category"]
    labels_str = ", ".join('"' + yaml_escape(l) + '"' for l in article.get("labels", []))
    explains   = yaml_escape(article.get("explains", "")[:300])
    why        = yaml_escape(article.get("why_matters", "")[:200])
    published  = datetime.datetime.now(datetime.timezone.utc).isoformat()
    body       = article.get("body_html", "")

    takeaways_lines = "\n".join('  - "' + yaml_escape(t) + '"' for t in article.get("takeaways", []))
    next_lines      = "\n".join('  - "' + yaml_escape(w) + '"' for w in article.get("whats_next", []))

    fm = (
        "---\n"
        f'title: "{title}"\n'
        f'standfirst: "{standfirst}"\n'
        f'category: "{category}"\n'
        f'labels: [{labels_str}]\n'
        f'slug: "{slug}"\n'
        f'featured_image: "{img_url}"\n'
        f'image_credit: "{yaml_escape(img_credit)}"\n'
        f'published_at: "{published}"\n'
        f'explains: "{explains}"\n'
        f'why_matters: "{why}"\n'
        f'takeaways:\n{takeaways_lines}\n'
        f'whats_next:\n{next_lines}\n'
        "---\n\n"
        f"{body}\n"
    )

    path = os.path.join(cat_dir, f"{slug}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(fm)
    print(f"Markdown written: {path}")
    return path

# ── Register in Supabase ──────────────────────────────────────────
def register_supabase(article: dict, slug: str, img_url: str, img_credit: str, wc: int):
    body = {
        "slug":           slug,
        "title":          article["headline"],
        "standfirst":     article.get("standfirst", ""),
        "category":       article["category"],
        "labels":         article.get("labels", []),
        "status":         "draft",   # Admin reviews before publishing
        "featured_image": img_url or None,
        "image_credit":   img_credit or None,
        "word_count":     wc,
        "read_time":      max(1, wc // 200),
        "excerpt":        re.sub(r"<[^>]+>", " ", article.get("body_html", ""))[:220].strip(),
        "explains":       article.get("explains", ""),
        "why_matters":    article.get("why_matters", ""),
        "takeaways":      article.get("takeaways", []),
        "whats_next":     article.get("whats_next", []),
    }
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/articles",
        headers=SUPABASE_HEADERS,
        json=body,
        timeout=15
    )
    if r.ok:
        print(f"Supabase: draft registered → {slug}")
    else:
        print(f"Supabase error: {r.status_code} {r.text}")

# ── Main ──────────────────────────────────────────────────────────
def main():
    log   = load_log()
    topic = get_news_topic() if EDITION not in ("travel", "daily_paws") else EDITION

    print(f"Generating {EDITION} edition...")
    article = generate_article(EDITION, topic, log)
    slug    = make_slug(article["headline"])
    wc      = word_count(article.get("body_html", ""))

    print(f"Fetching image for: {article.get('image_query', '')}")
    img_url, img_credit = get_image(article.get("image_query", "editorial news"), log)

    write_markdown(article, slug, img_url, img_credit)
    register_supabase(article, slug, img_url, img_credit, wc)

    # Update log
    log.setdefault("headlines", []).append(article["headline"])
    if img_url:
        log.setdefault("images", []).append(img_url)
    save_log(log)

    print(f"Done. Article: {article['headline']}")
    print(f"Slug: {slug}")
    print("Status: draft — review in admin dashboard before publishing")

if __name__ == "__main__":
    main()
