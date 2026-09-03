"""
NajiyaDaily Publisher — posts directly to najiyadaily.com
Generates article via Claude → writes Markdown to /content/
→ registers in Supabase → Netlify auto-deploys
"""
import os, re, json, time, datetime, requests, anthropic

SITE_URL       = os.environ["SITE_URL"]
EDITION        = os.environ.get("EDITION", "morning")
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]
REVALIDATE     = os.environ["REVALIDATE_SECRET"]
ANTHROPIC_KEY  = os.environ["ANTHROPIC_API_KEY"]
PEXELS_KEY     = os.environ.get("PEXELS_API_KEY","")
UNSPLASH_KEY   = os.environ.get("UNSPLASH_ACCESS_KEY","")
NEWS_API_KEY   = os.environ.get("NEWS_API_KEY","")
AMAZON_TAG     = os.environ.get("AMAZON_AFFILIATE_TAG","najiyadaily-20")

client = anthropic.Anthropic(api_key=ANTHROPIC_KEY, max_retries=4)

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
    except:
        return {}

def save_log(log):
    log["images"]    = log.get("images",    [])[-100:]
    log["headlines"] = log.get("headlines", [])[-50:]
    json.dump(log, open(PUBLISH_LOG,"w"), indent=2)

# ── Image fetch ───────────────────────────────────────────────────
def get_image(query: str, log: dict) -> tuple[str, str]:
    if not UNSPLASH_KEY:
        return "", ""
    try:
        r = requests.get(
            "https://api.unsplash.com/search/photos",
            headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"},
            params={"query":query,"per_page":5,"orientation":"landscape","content_filter":"high"},
            timeout=10
        )
        results = r.json().get("results",[])
        used    = log.get("images",[])
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
            params={"apiKey":NEWS_API_KEY,"language":"en","pageSize":10},
            timeout=10
        )
        articles = r.json().get("articles",[])
        if articles:
            return articles[0].get("title","global news today")
    except:
        pass
    return "global technology innovation 2026"

# ── Slug builder ──────────────────────────────────────────────────
def make_slug(title: str) -> str:
    slug = re.sub(r"[^a-z0-9\s-]","", title.lower())
    slug = re.sub(r"\s+","-", slug.strip())
    slug = re.sub(r"-+","-", slug)
    ts   = datetime.datetime.now().strftime("%Y%m%d%H%M")
    return f"{slug[:60]}-{ts}"

# ── Word count ────────────────────────────────────────────────────
def word_count(text: str) -> int:
    return len(re.sub(r"<[^>]+>"," ",text).split())

# ── Generate article ──────────────────────────────────────────────
EDITION_CONFIG = {
    "morning":    {"category":"World",     "labels":["World","Morning"],     "time":"8:00 AM"},
    "travel":     {"category":"Travel",    "labels":["Travel"],              "time":"11:00 AM"},
    "afternoon":  {"category":"World",     "labels":["World","Afternoon"],   "time":"1:00 PM"},
    "daily_paws": {"category":"Daily-Paws","labels":["Daily-Paws"],          "time":"3:00 PM"},
    "evening":    {"category":"World",     "labels":["World","Evening"],     "time":"7:00 PM"},
    "gadget":     {"category":"Gadgets",   "labels":["Gadgets","Review"],    "time":"manual"},
}

PAWS_ROTATION = {
    0:"Dog Spotlight", 1:"Cat Spotlight", 2:"Pet Health",
    3:"Heroic Tales",  4:"Love & Loss",   5:"Training & Tips", 6:"Pet Travel"
}

def safe_json_parse(text: str) -> dict:
    """
    Robustly parse JSON from Claude output.
    Handles: markdown fences, trailing commas, truncated output,
    single quotes, unescaped characters.
    """
    import re as _re

    # Strip markdown code fences
    text = text.strip()
    text = _re.sub(r"^```(?:json)?\s*", "", text)
    text = _re.sub(r"\s*```\s*$", "", text)
    text = text.strip()

    # Find first { and last } to extract JSON object
    start = text.find("{")
    end   = text.rfind("}")
    if start >= 0 and end >= 0:
        text = text[start:end+1]

    # Remove trailing commas before } or ]
    text = _re.sub(r",\s*([}\]])", r"\1", text)

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try with relaxed parsing — replace single quotes around keys/values
    try:
        import ast
        # ast.literal_eval handles single-quoted dicts
        result = ast.literal_eval(text)
        if isinstance(result, dict):
            return result
    except Exception:
        pass

    # Last resort — ask Claude again with explicit JSON instruction
    log.warning("JSON parse failed, retrying with stricter prompt")
    retry = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[
            {"role":"user","content": "Return ONLY a valid JSON object with these keys: "
             "headline, standfirst, category, labels, explains, why_matters, "
             "takeaways, whats_next, image_query, body_html. "
             "No markdown, no explanation, just the JSON."}
        ]
    )
    retry_text = retry.content[0].text.strip()
    retry_text = _re.sub(r"^```(?:json)?\s*", "", retry_text)
    retry_text = _re.sub(r"\s*```\s*$", "", retry_text)
    start = retry_text.find("{")
    end   = retry_text.rfind("}")
    if start >= 0 and end >= 0:
        retry_text = retry_text[start:end+1]
    retry_text = _re.sub(r",\s*([}\]])", r"\1", retry_text)
    return json.loads(retry_text)



def generate_article(edition: str, topic: str, log: dict) -> dict:
    cfg  = EDITION_CONFIG[edition]
    today = datetime.datetime.now().strftime("%B %d, %Y")
    recent_headlines = log.get("headlines", [])[-10:]
    avoid = "\n".join(f"- {h}" for h in recent_headlines) if recent_headlines else "None yet."

    if edition == "daily_paws":
        dow    = datetime.datetime.now().weekday()
        ptype  = PAWS_ROTATION.get(dow, "Dog Spotlight")
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

    # Retry up to 5 times with exponential backoff for 529 overload errors
    import time as _time
    last_err = None
    for attempt in range(5):
        try:
            msg = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=3000,
                messages=[{"role":"user","content":prompt}]
            )
            text = msg.content[0].text.strip()
            return safe_json_parse(text)
        except Exception as _e:
            last_err = _e
            err_str   = str(_e)
            # Retry on overload (529) or rate limit (429) or connection errors
            if any(code in err_str for code in ["529","529","overloaded","rate_limit","connection","timeout"]):
                wait = (2 ** attempt) + 5  # 6s, 7s, 9s, 13s, 21s
                print(f"Attempt {attempt+1} failed ({err_str[:60]}). Retrying in {wait}s...")
                _time.sleep(wait)
                continue
            raise  # Non-retryable error — raise immediately
    raise last_err

# ── Write Markdown file ───────────────────────────────────────────
def write_markdown(article: dict, slug: str, img_url: str, img_credit: str):
    cat_dir = "content/" + article["category"].lower().replace("-","")
    os.makedirs(cat_dir, exist_ok=True)

    # Pre-escape values — no backslashes inside f-strings
    title      = article.get("headline","").replace('"', '\"')
    standfirst = article.get("standfirst","").replace('"', '\"')
    category   = article["category"]
    labels_str = ", ".join('"' + l + '"' for l in article.get("labels",[]))
    explains   = article.get("explains","").replace('"', '\"')[:300]
    why        = article.get("why_matters","").replace('"', '\"')[:200]
    published  = datetime.datetime.utcnow().isoformat() + "Z"
    body       = article.get("body_html","")

    takeaways_lines = "\n".join('  - "' + t.replace('"','\"') + '"'
                                  for t in article.get("takeaways",[]))
    next_lines      = "\n".join('  - "' + w.replace('"','\"') + '"'
                                  for w in article.get("whats_next",[]))

    fm = (
        "---\n"
        + 'title: "' + title + '"\n'
        + 'standfirst: "' + standfirst + '"\n'
        + 'category: "' + category + '"\n'
        + 'labels: [' + labels_str + ']\n'
        + 'slug: "' + slug + '"\n'
        + 'featured_image: "' + img_url + '"\n'
        + 'image_credit: "' + img_credit + '"\n'
        + 'published_at: "' + published + '"\n'
        + 'explains: "' + explains + '"\n'
        + 'why_matters: "' + why + '"\n'
        + 'takeaways:\n' + takeaways_lines + '\n'
        + 'whats_next:\n' + next_lines + '\n'
        + "---\n\n"
        + body
    )

    path = cat_dir + "/" + slug + ".md"
    open(path, "w", encoding="utf-8").write(fm)
    print("Markdown written: " + path)
    return path


# ── Register in Supabase ──────────────────────────────────────────
def register_supabase(article: dict, slug: str, img_url: str, img_credit: str, wc: int):
    body = {
        "slug":          slug,
        "title":         article["headline"],
        "standfirst":    article.get("standfirst",""),
        "category":      article["category"],
        "labels":        article["labels"],
        "status":        "draft",   # Admin reviews before publishing
        "featured_image": img_url or None,
        "image_credit":  img_credit or None,
        "word_count":    wc,
        "read_time":     max(1, wc // 200),
        "excerpt":       re.sub(r"<[^>]+>"," ",article.get("body_html",""))[:220].strip(),
        "explains":      article.get("explains",""),
        "why_matters":   article.get("why_matters",""),
        "takeaways":     article.get("takeaways",[]),
        "whats_next":    article.get("whats_next",[]),
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
    topic = get_news_topic() if EDITION not in ("travel","daily_paws") else EDITION

    print(f"Generating {EDITION} edition...")
    article = generate_article(EDITION, topic, log)
    slug    = make_slug(article["headline"])
    wc      = word_count(article.get("body_html",""))

    print(f"Fetching image for: {article.get('image_query','')}")
    img_url, img_credit = get_image(article.get("image_query","editorial news"), log)

    write_markdown(article, slug, img_url, img_credit)
    register_supabase(article, slug, img_url, img_credit, wc)

    # Update log
    log.setdefault("headlines",[]).append(article["headline"])
    if img_url:
        log.setdefault("images",[]).append(img_url)
    save_log(log)

    print(f"Done. Article: {article['headline']}")
    print(f"Slug: {slug}")
    print(f"Status: draft — review in admin dashboard before publishing")

if __name__ == "__main__":
    main()
