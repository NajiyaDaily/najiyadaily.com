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

# ── Environment Configuration ─────────────────────────────────────
def get_required_env(key: str) -> str:
    val = os.environ.get(key, "").strip()
    if not val:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return val

SITE_URL      = os.environ.get("SITE_URL", "https://najiyadaily.com").strip()
EDITION       = os.environ.get("EDITION", "morning").strip().lower()
SUPABASE_URL  = get_required_env("SUPABASE_URL").rstrip("/")
SUPABASE_KEY  = get_required_env("SUPABASE_SERVICE_KEY")
ANTHROPIC_KEY = get_required_env("ANTHROPIC_API_KEY")

REVALIDATE    = os.environ.get("REVALIDATE_SECRET", "").strip()
PEXELS_KEY    = os.environ.get("PEXELS_API_KEY", "").strip()
UNSPLASH_KEY  = os.environ.get("UNSPLASH_ACCESS_KEY", "").strip()
NEWS_API_KEY  = os.environ.get("NEWS_API_KEY", "").strip()
AMAZON_TAG    = os.environ.get("AMAZON_AFFILIATE_TAG", "najiyadaily-20").strip()

# Candidate models in order of priority (handles account tier / 404 access differences)
CANDIDATE_MODELS = [
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307",
    "claude-3-opus-20240229",
]

client = anthropic.Anthropic(api_key=ANTHROPIC_KEY, max_retries=3)

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

PUBLISH_LOG = os.path.join("scripts", "publish_log.json")

# ── Publish Log ───────────────────────────────────────────────────
def load_log() -> dict:
    try:
        if os.path.exists(PUBLISH_LOG):
            with open(PUBLISH_LOG, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Notice: Could not load publish log ({e}). Initializing empty.")
    return {}

def save_log(log: dict):
    try:
        os.makedirs(os.path.dirname(PUBLISH_LOG), exist_ok=True)
        log["images"] = log.get("images", [])[-100:]
        log["headlines"] = log.get("headlines", [])[-50:]
        with open(PUBLISH_LOG, "w", encoding="utf-8") as f:
            json.dump(log, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Failed to save publish log: {e}")

# ── Image Fetch ───────────────────────────────────────────────────
def get_image(query: str, log: dict) -> tuple[str, str]:
    if not UNSPLASH_KEY:
        return "", ""
    try:
        r = requests.get(
            "https://api.unsplash.com/search/photos",
            headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"},
            params={
                "query": query,
                "per_page": 5,
                "orientation": "landscape",
                "content_filter": "high"
            },
            timeout=12
        )
        if not r.ok:
            print(f"Unsplash API returned HTTP {r.status_code}")
            return "", ""

        data = r.json()
        results = data.get("results", []) if isinstance(data, dict) else []
        used = set(log.get("images", []))

        photo = next((p for p in results if p.get("urls", {}).get("regular") not in used), None)
        if not photo and results:
            photo = results[0]

        if photo and "urls" in photo and "regular" in photo["urls"]:
            url = photo["urls"]["regular"]
            user = photo.get("user", {}).get("name", "Unknown Photographer")
            return url, f"Photo by {user} on Unsplash"
    except Exception as e:
        print(f"Notice: Image fetch bypassed due to error: {e}")
    return "", ""

# ── News Topics ───────────────────────────────────────────────────
def get_news_topic() -> str:
    fallback = "global technology and lifestyle trends 2026"
    if not NEWS_API_KEY:
        return fallback
    try:
        r = requests.get(
            "https://newsapi.org/v2/top-headlines",
            params={"apiKey": NEWS_API_KEY, "language": "en", "pageSize": 10},
            timeout=10
        )
        if r.ok:
            data = r.json()
            articles = data.get("articles", []) if isinstance(data, dict) else []
            for art in articles:
                title = art.get("title", "").strip()
                if title and "[Removed]" not in title:
                    return title
    except Exception as e:
        print(f"Notice: News fetch bypassed ({e}). Using default topic.")
    return fallback

# ── Helpers ───────────────────────────────────────────────────────
def make_slug(title: str) -> str:
    slug = re.sub(r"[^a-z0-9\s-]", "", title.lower())
    slug = re.sub(r"\s+", "-", slug.strip())
    slug = re.sub(r"-+", "-", slug)
    ts = datetime.datetime.now().strftime("%Y%m%d%H%M")
    return f"{slug[:50]}-{ts}"

def word_count(text: str) -> int:
    clean = re.sub(r"<[^>]+>", " ", text)
    return len(clean.split())

# ── Robust JSON Parser ────────────────────────────────────────────
def clean_and_parse_json(text: str) -> dict:
    import ast

    raw = text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s*```\s*$", "", raw)
    raw = raw.strip()

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        raw = raw[start:end+1]

    # Clean trailing commas
    raw = re.sub(r",\s*([}\]])", r"\1", raw)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    try:
        val = ast.literal_eval(raw)
        if isinstance(val, dict):
            return val
    except Exception:
        pass

    raise ValueError(f"Failed to parse model output into JSON. Raw slice: {raw[:150]}")

# ── Editions ──────────────────────────────────────────────────────
EDITION_CONFIG = {
    "morning":    {"category": "World",      "labels": ["World", "Morning"]},
    "travel":     {"category": "Travel",     "labels": ["Travel"]},
    "afternoon":  {"category": "World",      "labels": ["World", "Afternoon"]},
    "daily_paws": {"category": "Daily-Paws", "labels": ["Daily-Paws"]},
    "evening":    {"category": "World",      "labels": ["World", "Evening"]},
    "gadget":     {"category": "Gadgets",    "labels": ["Gadgets", "Review"]},
}

PAWS_ROTATION = {
    0: "Dog Spotlight", 1: "Cat Spotlight", 2: "Pet Health",
    3: "Heroic Tales",  4: "Love & Loss",   5: "Training & Tips", 6: "Pet Travel"
}

# ── Resilient Article Generation ─────────────────────────────────
def generate_article(edition: str, topic: str, log: dict) -> dict:
    cfg = EDITION_CONFIG.get(edition, EDITION_CONFIG["morning"])
    today = datetime.datetime.now().strftime("%B %d, %Y")
    recent = log.get("headlines", [])[-10:]
    avoid = "\n".join(f"- {h}" for h in recent) if recent else "None yet."

    if edition == "daily_paws":
        dow = datetime.datetime.now().weekday()
        ptype = PAWS_ROTATION.get(dow, "Dog Spotlight")
        system_instruction = (
            "You are the warm, passionate writer behind NajiyaDaily's Daily Paws edition. "
            "Never say 'dog' or 'cat' alone. Use pet puns, heartwarming vocabulary, and write 700+ words."
        )
        user_prompt = f"Today: {today}. Write a Daily Paws article: {ptype}.\nRecent headlines to avoid:\n{avoid}"
    elif edition == "travel":
        system_instruction = (
            "You are NajiyaDaily's travel editor. Write a sensory, practical destination guide. "
            "Include natural hotel suggestions with Booking.com links: https://www.booking.com/city/CITYCODE/CITYNAME.html?aid=101867344. "
            "Length: 800+ words."
        )
        user_prompt = f"Today: {today}. Write a destination travel guide for a trending city.\nAvoid:\n{avoid}"
    else:
        system_instruction = (
            "You are a senior journalist at NajiyaDaily. Write directly, analytically, with strong perspective. "
            "Connect world events to human impact. Include 'What Happens Next' (3 points). Length: 800+ words."
        )
        user_prompt = f"Today: {today}. Edition: {edition}. Topic: {topic}.\nRecent headlines to avoid:\n{avoid}"

    schema_prompt = f"""
{user_prompt}

Return strictly a valid JSON object matching this schema without any markdown wrapping:
{{
  "headline": "Compelling headline (12-15 words)",
  "standfirst": "One italicized summary sentence",
  "category": "{cfg['category']}",
  "labels": {json.dumps(cfg['labels'])},
  "explains": "2 sentences of essential context",
  "why_matters": "1 sentence on the practical impact",
  "takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "whats_next": ["Watch item 1", "Watch item 2", "Watch item 3"],
  "image_query": "4-5 descriptive photo search keywords",
  "body_html": "<p>Article paragraphs...</p><h3>Subheading</h3><p>More text...</p>"
}}
"""

    # Model Fallback Cascade Loop
    last_exception = None
    for model_name in CANDIDATE_MODELS:
        print(f"Attempting article generation with model: {model_name}")
        for attempt in range(1, 4):
            try:
                response = client.messages.create(
                    model=model_name,
                    max_tokens=3500,
                    system=system_instruction,
                    messages=[{"role": "user", "content": schema_prompt}]
                )
                text = response.content[0].text
                article_data = clean_and_parse_json(text)

                # Ensure minimum schema requirements
                if not article_data.get("headline") or not article_data.get("body_html"):
                    raise ValueError("Model output omitted critical fields (headline or body_html).")

                print(f"Successfully generated article using: {model_name}")
                return article_data

            except anthropic.NotFoundError as nfe:
                print(f"Model {model_name} not available on this API key (404). Skipping to next model...")
                last_exception = nfe
                break  # Don't retry same model on 404, advance to next candidate

            except anthropic.APIStatusError as ase:
                last_exception = ase
                code = getattr(ase, "status_code", 500)
                if code in [429, 529, 500, 502, 503, 504]:
                    sleep_time = (2 ** attempt) * 4 + 2
                    print(f"Status {code} on {model_name}. Retrying in {sleep_time}s (Attempt {attempt}/3)...")
                    time.sleep(sleep_time)
                else:
                    break

            except Exception as ex:
                last_exception = ex
                sleep_time = attempt * 3
                print(f"Parse or connection error: {ex}. Retrying in {sleep_time}s...")
                time.sleep(sleep_time)

    raise RuntimeError(f"All candidate models exhausted. Last error: {last_exception}")

# ── Write Markdown File ───────────────────────────────────────────
def write_markdown(article: dict, slug: str, img_url: str, img_credit: str) -> str:
    category = article.get("category", "World")
    cat_dir = os.path.join("content", re.sub(r"[^a-zA-Z0-9]", "", category.lower()))
    os.makedirs(cat_dir, exist_ok=True)

    published = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Safe YAML frontmatter construction
    def yml_str(val: str) -> str:
        s = str(val or "").replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")
        return f'"{s}"'

    labels = [yml_str(l) for l in article.get("labels", [category])]
    takeaways = "\n".join(f'  - {yml_str(t)}' for t in article.get("takeaways", []))
    whats_next = "\n".join(f'  - {yml_str(w)}' for w in article.get("whats_next", []))

    frontmatter = f"""---
title: {yml_str(article.get("headline", ""))}
standfirst: {yml_str(article.get("standfirst", ""))}
category: {yml_str(category)}
labels: [{", ".join(labels)}]
slug: {yml_str(slug)}
featured_image: {yml_str(img_url)}
image_credit: {yml_str(img_credit)}
published_at: "{published}"
explains: {yml_str(article.get("explains", "")[:300])}
why_matters: {yml_str(article.get("why_matters", "")[:200])}
takeaways:
{takeaways}
whats_next:
{whats_next}
---

{article.get("body_html", "").strip()}
"""

    filepath = os.path.join(cat_dir, f"{slug}.md")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(frontmatter)

    print(f"Markdown successfully saved: {filepath}")
    return filepath

# ── Supabase Registration ─────────────────────────────────────────
def register_supabase(article: dict, slug: str, img_url: str, img_credit: str, wc: int):
    payload = {
        "slug": slug,
        "title": article.get("headline", ""),
        "standfirst": article.get("standfirst", ""),
        "category": article.get("category", "World"),
        "labels": article.get("labels", []),
        "status": "draft",
        "featured_image": img_url or None,
        "image_credit": img_credit or None,
        "word_count": wc,
        "read_time": max(1, wc // 200),
        "excerpt": re.sub(r"<[^>]+>", " ", article.get("body_html", ""))[:220].strip(),
        "explains": article.get("explains", ""),
        "why_matters": article.get("why_matters", ""),
        "takeaways": article.get("takeaways", []),
        "whats_next": article.get("whats_next", []),
    }

    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/articles",
            headers=SUPABASE_HEADERS,
            json=payload,
            timeout=15
        )
        if r.ok:
            print(f"Supabase record synced: draft registered → {slug}")
        else:
            print(f"Supabase HTTP {r.status_code} Notice: {r.text}")
    except Exception as e:
        print(f"Warning: Supabase registration encountered an issue ({e}). Continuing build.")

# ── Main Entrypoint ───────────────────────────────────────────────
def main():
    log = load_log()
    topic = get_news_topic() if EDITION not in ("travel", "daily_paws") else EDITION

    print(f"--- Starting publisher for edition: {EDITION} ---")
    article = generate_article(EDITION, topic, log)

    slug = make_slug(article.get("headline", f"{EDITION}-update"))
    wc = word_count(article.get("body_html", ""))

    query = article.get("image_query", f"{EDITION} scenery")
    print(f"Fetching visual for: {query}")
    img_url, img_credit = get_image(query, log)

    write_markdown(article, slug, img_url, img_credit)
    register_supabase(article, slug, img_url, img_credit, wc)

    log.setdefault("headlines", []).append(article["headline"])
    if img_url:
        log.setdefault("images", []).append(img_url)
    save_log(log)

    print("--- Completed Successfully ---")
    print(f"Article: {article.get('headline')}")
    print(f"Slug: {slug}")

if __name__ == "__main__":
    main()
