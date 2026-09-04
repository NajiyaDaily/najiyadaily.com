"""
NajiyaDaily Publisher v3.0 — Hardened for zero-failure production
Generates article via Claude → writes Markdown → registers in Supabase as draft
Admin reviews at najiyadaily.com/admin before publishing

Error handling strategy:
- API overload / rate limit  → exponential backoff + model fallback cascade
- JSON parse failure         → re-prompt Claude (not a sleep retry)
- Image failure              → continue without image (never blocks publishing)
- Supabase failure           → log and continue (Markdown file still written)
- Any unhandled error        → full traceback printed, exit code 1
"""

import os, re, json, time, datetime, requests, anthropic

# ── Environment ───────────────────────────────────────────────────

def require(key):
    val = os.environ.get(key, "").strip()
    if not val:
        raise RuntimeError("Required environment variable missing: " + key)
    return val

def optional(key, default=""):
    return os.environ.get(key, default).strip()

SITE_URL      = optional("SITE_URL", "https://www.najiyadaily.com")
EDITION       = optional("EDITION", "morning").lower()
SUPABASE_URL  = require("SUPABASE_URL").rstrip("/")
SUPABASE_KEY  = require("SUPABASE_SERVICE_KEY")
ANTHROPIC_KEY = require("ANTHROPIC_API_KEY")
UNSPLASH_KEY  = optional("UNSPLASH_ACCESS_KEY")
NEWS_API_KEY  = optional("NEWS_API_KEY")
AMAZON_TAG    = optional("AMAZON_AFFILIATE_TAG", "najiyadaily-20")

# Model cascade: primary first; on 404 (not on plan) skip to next
MODELS = [
    "claude-sonnet-4-6",           # Primary — confirmed on this account
    "claude-haiku-4-5-20251001",   # Fast fallback
    "claude-3-5-sonnet-20241022",  # Older fallback — widely available
    "claude-3-haiku-20240307",     # Last resort — always available
]

client = anthropic.Anthropic(api_key=ANTHROPIC_KEY, max_retries=2)

SUPABASE_HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

PUBLISH_LOG = os.path.join("scripts", "publish_log.json")

# ── Edition config ────────────────────────────────────────────────

EDITION_CONFIG = {
    "morning":    {"category": "World",      "labels": ["World", "Morning"]},
    "travel":     {"category": "Travel",     "labels": ["Travel"]},
    "afternoon":  {"category": "World",      "labels": ["World", "Afternoon"]},
    "daily_paws": {"category": "Daily-Paws", "labels": ["Daily-Paws"]},
    "evening":    {"category": "World",      "labels": ["World", "Evening"]},
    "gadget":     {"category": "Gadgets",    "labels": ["Gadgets", "Review"]},
}

PAWS_ROTATION = {
    0: "Dog Spotlight",  1: "Cat Spotlight",  2: "Pet Health",
    3: "Heroic Tales",   4: "Love & Loss",    5: "Training & Tips",
    6: "Pet Travel",
}

# ── Publish log ───────────────────────────────────────────────────

def load_log():
    try:
        if os.path.exists(PUBLISH_LOG):
            with open(PUBLISH_LOG, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print("Notice: Publish log unreadable (" + str(e) + "). Starting fresh.")
    return {}

def save_log(log):
    try:
        os.makedirs(os.path.dirname(PUBLISH_LOG), exist_ok=True)
        log["images"]    = log.get("images",    [])[-100:]
        log["headlines"] = log.get("headlines", [])[-50:]
        with open(PUBLISH_LOG, "w", encoding="utf-8") as f:
            json.dump(log, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Warning: Could not save publish log: " + str(e))

# ── Helpers ───────────────────────────────────────────────────────

def make_slug(title):
    slug = re.sub(r"[^a-z0-9\s-]", "", title.lower())
    slug = re.sub(r"\s+", "-", slug.strip())
    slug = re.sub(r"-+", "-", slug)
    ts   = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    return slug[:50] + "-" + ts

def word_count(html):
    return len(re.sub(r"<[^>]+>", " ", html).split())

def is_placeholder(body):
    if not body or len(body.strip()) < 200:
        return True
    bad = ["<p>...</p>", "article paragraphs", "800+ words", "[article content]",
           "[content here]", "placeholder", "lorem ipsum"]
    lower = body.lower()
    return any(b in lower for b in bad)

# ── JSON parser ───────────────────────────────────────────────────

def parse_json(text):
    import ast

    raw = text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s*```\s*$", "", raw).strip()

    start = raw.find("{")
    end   = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        raw = raw[start:end + 1]
    else:
        raise ValueError("No JSON object found in model response.")

    raw = re.sub(r",\s*([}\]])", r"\1", raw)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    try:
        result = ast.literal_eval(raw)
        if isinstance(result, dict):
            return result
    except Exception:
        pass

    cleaned = re.sub(r"[\x00-\x1f\x7f]", " ", raw)
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError("JSON parse failed after all attempts: " + str(e) + ". Snippet: " + raw[:120])

# ── Prompt builder ────────────────────────────────────────────────

def build_prompt(edition, topic, avoid):
    cfg   = EDITION_CONFIG.get(edition, EDITION_CONFIG["morning"])
    today = datetime.datetime.now().strftime("%B %d, %Y")

    schema = (
        "{\n"
        '  "headline": "12-15 word compelling headline",\n'
        '  "standfirst": "One italicised summary sentence (max 40 words)",\n'
        '  "category": "' + cfg["category"] + '",\n'
        '  "labels": ' + json.dumps(cfg["labels"]) + ',\n'
        '  "explains": "2 sentences of essential background context",\n'
        '  "why_matters": "1 sentence on real-world impact",\n'
        '  "takeaways": ["Point 1", "Point 2", "Point 3"],\n'
        '  "whats_next": ["Watch item 1", "Watch item 2", "Watch item 3"],\n'
        '  "image_query": "4-5 word photo search query",\n'
        '  "body_html": "<p>Full article...</p><h3>Subheading</h3><p>More...</p>"\n'
        "}"
    )

    rules = (
        "CRITICAL OUTPUT RULES:\n"
        "1. Output ONLY the raw JSON object — no markdown, no explanation.\n"
        "2. Start with { and end with }.\n"
        "3. No trailing commas. No single-quoted strings. No JS comments.\n"
        "4. body_html must be 800+ words of real article content.\n"
        "5. Never use placeholder text like ... or [content here].\n"
    )

    if edition == "daily_paws":
        dow   = datetime.datetime.now().weekday()
        ptype = PAWS_ROTATION.get(dow, "Dog Spotlight")
        system = (
            "You are the warm, passionate Daily Paws editor at NajiyaDaily. "
            "Never say dog or cat alone — use fur baby, four-legged friend, furball, loyal companion. "
            "Include at least 2 pet puns and 1 famous quote about pets. "
            "Use warm vocabulary: beloved, darling, cherished, adored."
        )
        user = (
            "Today: " + today + ". Write Daily Paws — " + ptype + ".\n\n"
            "AVOID these recent headlines:\n" + avoid + "\n\n"
            + rules + "\nReturn this exact JSON structure:\n" + schema
        )

    elif edition == "travel":
        system = (
            "You are NajiyaDaily's travel editor. Write sensory, specific, practical destination guides. "
            "Include 2-3 natural hotel recommendations with Booking.com links: "
            "https://www.booking.com/city/XX/cityname.html?aid=101867344 "
            "(replace XX with country code, cityname with city). Write 800+ words."
        )
        user = (
            "Today: " + today + ". Write a travel guide for a trending destination.\n\n"
            "AVOID:\n" + avoid + "\n\n"
            + rules + "\nReturn this exact JSON structure:\n" + schema
        )

    elif edition == "gadget":
        system = (
            "You are NajiyaDaily's tech and gadget reviewer. Write detailed, honest reviews. "
            "Include Amazon affiliate links with tag=" + AMAZON_TAG + " where relevant. "
            "Cover specs, real-world use, pros/cons, verdict. Write 800+ words."
        )
        user = (
            "Today: " + today + ". Write a review of a notable recent gadget or tech product.\n\n"
            "AVOID:\n" + avoid + "\n\n"
            + rules + "\nReturn this exact JSON structure:\n" + schema
        )

    else:
        label = {"morning": "Morning", "afternoon": "Afternoon", "evening": "Evening"}.get(edition, edition.capitalize())
        system = (
            "You are a senior journalist at NajiyaDaily writing the " + label + " Edition. "
            "Write directly and analytically with a clear point of view. "
            "Connect global events to everyday human impact. "
            "Open with the single most important fact. Write 800+ words."
        )
        user = (
            "Today: " + today + ". " + label + " Edition.\n"
            "News topic: " + topic + "\n\n"
            "AVOID these recent headlines:\n" + avoid + "\n\n"
            + rules + "\nReturn this exact JSON structure:\n" + schema
        )

    return system, user

# ── Article generation ────────────────────────────────────────────

def generate_article(edition, topic, log):
    recent = log.get("headlines", [])[-10:]
    avoid  = "\n".join("- " + h for h in recent) if recent else "None yet."
    system_prompt, user_prompt = build_prompt(edition, topic, avoid)

    RETRYABLE = {429, 500, 502, 503, 504, 529}
    last_error = None

    for model in MODELS:
        print("  Trying model: " + model)
        api_attempts = 0

        while api_attempts < 4:
            api_attempts += 1
            try:
                response = client.messages.create(
                    model=model,
                    max_tokens=4000,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                    timeout=90,
                )
                raw_text = response.content[0].text

                # Parse JSON
                try:
                    article = parse_json(raw_text)
                except ValueError as parse_err:
                    print("  Parse error: " + str(parse_err))
                    if api_attempts < 3:
                        print("  Re-prompting Claude for valid JSON...")
                        fix = client.messages.create(
                            model=model,
                            max_tokens=4000,
                            system="Output ONLY a raw JSON object. Start with { end with }. No markdown.",
                            messages=[
                                {"role": "user",      "content": user_prompt},
                                {"role": "assistant", "content": raw_text},
                                {"role": "user",      "content":
                                    "Your previous response was not valid JSON. "
                                    "Output ONLY the JSON object, starting with { and ending with }. "
                                    "No markdown fences, no explanation, no trailing commas."},
                            ],
                            timeout=90,
                        )
                        raw_text = fix.content[0].text
                        article  = parse_json(raw_text)
                    else:
                        raise

                # Validate
                if not article.get("headline", "").strip():
                    raise ValueError("Empty headline in response.")
                if is_placeholder(article.get("body_html", "")):
                    raise ValueError("Body is placeholder text, not real content.")

                print("  Article generated successfully.")
                return article

            except anthropic.NotFoundError:
                print("  Model " + model + " not available on this API key. Skipping.")
                last_error = "Model " + model + " not found (404)"
                break

            except anthropic.APIStatusError as e:
                last_error = e
                code = getattr(e, "status_code", 0)
                if code in RETRYABLE:
                    wait = min((2 ** api_attempts) * 5, 60)
                    print("  API error " + str(code) + ". Waiting " + str(wait) + "s (attempt " + str(api_attempts) + "/4)...")
                    time.sleep(wait)
                    continue
                else:
                    print("  Non-retryable API error " + str(code) + ". Skipping model.")
                    break

            except anthropic.APIConnectionError as e:
                last_error = e
                wait = api_attempts * 5
                print("  Connection error. Waiting " + str(wait) + "s (attempt " + str(api_attempts) + "/4)...")
                time.sleep(wait)
                continue

            except ValueError as e:
                last_error = e
                print("  Content validation failed: " + str(e) + ". Trying next model.")
                break

            except Exception as e:
                last_error = e
                print("  Unexpected error: " + type(e).__name__ + ": " + str(e))
                if api_attempts < 3:
                    time.sleep(api_attempts * 4)
                    continue
                break

    raise RuntimeError(
        "All " + str(len(MODELS)) + " models exhausted. Last error: " + str(last_error)
    )

# ── Image fetch ───────────────────────────────────────────────────

def get_image(query, log):
    if not UNSPLASH_KEY:
        return "", ""
    try:
        r = requests.get(
            "https://api.unsplash.com/search/photos",
            headers={"Authorization": "Client-ID " + UNSPLASH_KEY},
            params={"query": query, "per_page": 8, "orientation": "landscape", "content_filter": "high"},
            timeout=12,
        )
        if not r.ok:
            return "", ""
        results = r.json().get("results", [])
        used    = set(log.get("images", []))
        photo   = next((p for p in results if p.get("urls", {}).get("regular") not in used), results[0] if results else None)
        if photo:
            url  = photo["urls"]["regular"]
            name = photo.get("user", {}).get("name", "Unsplash")
            return url, "Photo by " + name + " on Unsplash"
    except Exception as e:
        print("  Notice: Image fetch skipped (" + str(e) + ")")
    return "", ""

# ── News topic ────────────────────────────────────────────────────

def get_news_topic():
    if not NEWS_API_KEY:
        return "global technology and world affairs 2026"
    try:
        r = requests.get(
            "https://newsapi.org/v2/top-headlines",
            params={"apiKey": NEWS_API_KEY, "language": "en", "pageSize": 10},
            timeout=10,
        )
        if r.ok:
            for art in r.json().get("articles", []):
                title = art.get("title", "").strip()
                if title and "[Removed]" not in title and len(title) > 10:
                    return title
    except Exception as e:
        print("  Notice: News API skipped (" + str(e) + ")")
    return "global technology and world affairs 2026"

# ── Markdown writer ───────────────────────────────────────────────

def write_markdown(article, slug, img_url, img_credit):
    category = article.get("category", "World")
    cat_slug = re.sub(r"[^a-z0-9]", "", category.lower())
    cat_dir  = os.path.join("content", cat_slug)
    os.makedirs(cat_dir, exist_ok=True)

    published = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    def y(val, max_len=0):
        s = str(val or "")
        if max_len:
            s = s[:max_len]
        s = s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").replace("\r", "")
        return '"' + s + '"'

    labels_yaml     = ", ".join(y(l) for l in article.get("labels", [category]))
    takeaways_yaml  = "\n".join("  - " + y(t) for t in article.get("takeaways", []))
    whats_next_yaml = "\n".join("  - " + y(w) for w in article.get("whats_next", []))

    fm = (
        "---\n"
        "title: "          + y(article.get("headline", "")) + "\n"
        "standfirst: "     + y(article.get("standfirst", "")) + "\n"
        "category: "       + y(category) + "\n"
        "labels: ["        + labels_yaml + "]\n"
        "slug: "           + y(slug) + "\n"
        "featured_image: " + y(img_url) + "\n"
        "image_credit: "   + y(img_credit) + "\n"
        'published_at: "'  + published + '"\n'
        "explains: "       + y(article.get("explains", ""), 300) + "\n"
        "why_matters: "    + y(article.get("why_matters", ""), 200) + "\n"
        "takeaways:\n"     + takeaways_yaml + "\n"
        "whats_next:\n"    + whats_next_yaml + "\n"
        "---\n\n"
    )

    body     = article.get("body_html", "").strip()
    filepath = os.path.join(cat_dir, slug + ".md")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(fm + body + "\n")

    print("  Markdown saved: " + filepath + " (" + str(word_count(body)) + " words)")
    return filepath

# ── Supabase registration ─────────────────────────────────────────

def register_supabase(article, slug, img_url, img_credit, wc):
    base = SUPABASE_URL
    if "/rest/v1" in base:
        base = base.split("/rest/v1")[0]
    endpoint = base + "/rest/v1/articles"

    payload = {
        "slug":           slug,
        "title":          article.get("headline", "")[:500],
        "standfirst":     article.get("standfirst", "")[:500],
        "category":       article.get("category", "World"),
        "labels":         article.get("labels", []),
        "status":         "draft",
        "featured_image": img_url or None,
        "image_credit":   img_credit or None,
        "word_count":     wc,
        "read_time":      max(1, wc // 200),
        "excerpt":        re.sub(r"<[^>]+>", " ", article.get("body_html", ""))[:220].strip(),
        "explains":       article.get("explains", "")[:600],
        "why_matters":    article.get("why_matters", "")[:400],
        "takeaways":      article.get("takeaways", [])[:10],
        "whats_next":     article.get("whats_next", [])[:10],
        "body_html":      article.get("body_html", ""),
    }

    for attempt in range(3):
        try:
            r = requests.post(endpoint, headers=SUPABASE_HEADERS, json=payload, timeout=20)
            if r.ok:
                print("  Supabase: draft registered → " + slug)
                return True
            if r.status_code == 409:
                payload["slug"] = slug + "-" + str(int(time.time()))
                print("  Supabase: slug conflict, retrying with " + payload["slug"])
                continue
            print("  Supabase HTTP " + str(r.status_code) + ": " + r.text[:200])
            return False
        except requests.Timeout:
            print("  Supabase timeout (attempt " + str(attempt + 1) + "/3). Retrying...")
            time.sleep(3)
        except Exception as e:
            print("  Supabase error: " + str(e))
            return False
    return False

# ── Main ──────────────────────────────────────────────────────────

def main():
    sep = "=" * 55
    print("\n" + sep)
    print("  NajiyaDaily Publisher — " + EDITION.upper())
    print("  " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " UTC")
    print(sep + "\n")

    if EDITION not in EDITION_CONFIG:
        raise ValueError(
            "Unknown edition: '" + EDITION + "'. Valid: " + ", ".join(EDITION_CONFIG.keys())
        )

    log = load_log()

    if EDITION in ("travel", "daily_paws", "gadget"):
        topic = EDITION
    else:
        print("Fetching news topic...")
        topic = get_news_topic()
        print("Topic: " + topic[:80])

    print("\nGenerating article...")
    article  = generate_article(EDITION, topic, log)
    headline = article.get("headline", "untitled")
    print("Headline: " + headline)

    slug = make_slug(headline)
    wc   = word_count(article.get("body_html", ""))
    print("Slug: " + slug + " | Words: " + str(wc))

    query = article.get("image_query", EDITION + " photography")
    print("\nFetching image: " + query)
    img_url, img_credit = get_image(query, log)
    status = (img_url[:55] + "...") if img_url else "none (article publishes without image)"
    print("Image: " + status)

    print("\nWriting Markdown...")
    write_markdown(article, slug, img_url, img_credit)

    print("\nRegistering in Supabase...")
    register_supabase(article, slug, img_url, img_credit, wc)

    log.setdefault("headlines", []).append(headline)
    if img_url:
        log.setdefault("images", []).append(img_url)
    save_log(log)

    print("\n" + sep)
    print("  DONE — review at najiyadaily.com/admin")
    print(sep + "\n")

if __name__ == "__main__":
    main()
