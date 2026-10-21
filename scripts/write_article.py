#!/usr/bin/env python3
"""Nagcoop article bot (free: GitHub Models).

Writes ONE new blog article and adds it to the top of posts.json. The workflow
then opens a Pull Request so a human reviews the draft before it goes live.
Uses GitHub Models (free tier) through the workflow's GITHUB_TOKEN, so there
is no API key and no cost. Standard library only.

Env:
  GITHUB_TOKEN  provided by the workflow (needs `models: read`)
  TOPIC         optional; if empty, the bot picks a story from news.json
  MODEL         optional; defaults to openai/gpt-4.1
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

API_URL = "https://models.github.ai/inference/chat/completions"
MODEL = os.environ.get("MODEL") or "openai/gpt-4.1"
UA = "Mozilla/5.0 (compatible; NagcoopArticleBot/1.0; +https://nagcoop.github.io)"
PRIORITY_SOURCES = {"Time Extension": 3, "RetroRGB": 3, "Nintendo Life": 1, "PC Gamer": 1}
PRIORITY_WORDS = re.compile(r"recomp|decomp|retro|emulat|port|remaster|remake|preserv|homebrew|arcade|co-?op|indie|n64|snes|ps1|neo ?geo|sega|classic", re.I)
POSTS = "posts.json"
NEWS = "news.json"

CATEGORIES = {
    # category: (badge, badge class, card background)
    "Recompilation": ("Tutorial", "badge-tut", "#0d1a2a"),
    "Emulation":     ("Retro", "badge-retro", "#1a0d2a"),
    "Co-op":         ("Co-op", "badge-coop", "#0d1f0d"),
    "Indie":         ("Indie", "badge-indie", "#2a1a0d"),
    "Releases":      ("News", "badge-news", "#3a1a1a"),
}

SYSTEM = """You write for Nagcoop, an English-language gaming site focused on retro games,
emulation, native PC recompilations (recomps/decomps), co-op and indie games.
Voice: enthusiastic, direct, a bit of heavy-metal attitude, never clickbait.

Hard rules:
- Every specific fact (dates, prices, versions, features, names) must come from the
  SOURCE TEXT you are given. If something isn't in it and you aren't certain, leave it
  out. Never invent quotes, numbers or release dates.
- Write an ORIGINAL article in your own words: add context, explanation and opinion.
  Do not copy or closely paraphrase the source; never quote more than one short phrase.
- Never link to or explain how to obtain pirated ROMs, BIOS files or cracked games.
  When relevant, say players need their own legally owned copy.
- 600 to 900 words.

Output ONLY a JSON object, no markdown fences, with these keys:
  "title": string, under 90 characters
  "desc": string, one or two sentences, under 200 characters
  "cat": one of "Recompilation", "Emulation", "Co-op", "Indie", "Releases"
  "bg": 2 to 7 uppercase characters for the card art (e.g. "SONIC", "N64")
  "tags": array of 3 to 6 short lowercase tags
  "body": the article HTML using ONLY these tags: h2, h3, p, ul, ol, li, strong, em,
          code, a (with href, target="_blank" rel="noopener"), and
          <div class="highlight-box"><p>...</p></div> for one key callout.
          No h1, no images, no scripts, no inline styles.
          End with a <p> crediting the original source with a link."""


def call_model(prompt):
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        sys.exit("GITHUB_TOKEN is not set (the workflow needs `permissions: models: read`).")
    body = {
        "model": MODEL,
        "temperature": 0.7,
        "max_tokens": 3000,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode(),
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {token}",
            "accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"GitHub Models error {e.code}: {e.read().decode(errors='replace')[:800]}")
    text = data["choices"][0]["message"]["content"] or ""
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        sys.exit("The model did not return JSON:\n" + text[:1500])
    return json.loads(m.group(0))


def page_text(url, limit=9000):
    """Fetch the source article and keep only its paragraph text."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[warn] could not fetch source: {e}", file=sys.stderr)
        return ""
    paras = re.findall(r"<p[^>]*>(.*?)</p>", raw, re.S | re.I)
    text = " ".join(re.sub(r"<[^>]+>", " ", x) for x in paras)
    text = re.sub(r"\s+", " ", __import__("html").unescape(text)).strip()
    return text[:limit]


def sanitize(html):
    html = re.sub(r"<(script|style|iframe|object|embed)[^>]*>.*?</\1>", "", html, flags=re.S | re.I)
    html = re.sub(r"\son\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", html, flags=re.I)
    html = re.sub(r"\sstyle\s*=\s*(\"[^\"]*\"|'[^']*')", "", html, flags=re.I)
    html = re.sub(r"href\s*=\s*([\"'])\s*javascript:[^\"']*\1", 'href="#"', html, flags=re.I)
    html = re.sub(r"</?(h1|img|form|input|button)[^>]*>", "", html, flags=re.I)
    return html.replace("`", "'").strip()


def slugify(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:70].rstrip("-") or "article"


def pick_prompt(posts):
    """Returns (prompt, source_urls)."""
    existing = "\n".join("- " + p["title"] for p in posts[:40])
    topic = (os.environ.get("TOPIC") or "").strip()
    if topic:
        return (f"""Write a new evergreen Nagcoop article about: {topic}

There is no source text for this one: write from well-established knowledge only and
avoid recent specifics (versions, prices, dates) you are not certain about.

Existing articles (don't repeat them):
{existing}""", [])
    try:
        news = json.load(open(NEWS, encoding="utf-8")).get("items", [])
    except (OSError, ValueError):
        news = []
    used = {u for p in posts for u in p.get("sources", [])}
    titles = {p["title"].lower() for p in posts}
    candidates = [n for n in news if n.get("link") not in used and n["title"].lower() not in titles]
    if not candidates:
        sys.exit("No unused stories in news.json; set TOPIC instead.")

    def score(n):
        s = PRIORITY_SOURCES.get(n.get("source"), 0)
        s += 2 * len(PRIORITY_WORDS.findall(n["title"] + " " + n.get("summary", "")))
        return s

    for story in sorted(candidates, key=score, reverse=True)[:5]:
        text = page_text(story["link"])
        if len(text) > 800:
            break
    else:
        story, text = max(candidates, key=score), ""
    print(f"Story: [{story['source']}] {story['title']}")
    source = text or story.get("summary", "")
    return (f"""Write a Nagcoop article based on this story. Explain it, add context for retro
and PC gamers, and give your take. Credit {story['source']} with a link to {story['link']}
at the end.

HEADLINE: {story['title']}
SOURCE: {story['source']} ({story['link']})
SOURCE TEXT:
{source}

Existing articles (don't repeat them):
{existing}""", [story["link"]])


def main():
    posts = json.load(open(POSTS, encoding="utf-8"))
    prompt, sources = pick_prompt(posts)
    art = call_model(prompt)

    for k in ("title", "desc", "cat", "bg", "tags", "body"):
        if not art.get(k):
            sys.exit(f"Missing field '{k}' in model output.")
    cat = art["cat"] if art["cat"] in CATEGORIES else "Releases"
    badge, bc, bgc = CATEGORIES[cat]

    ids = {p["id"] for p in posts}
    base = slugify(art["title"])
    pid, n = base, 2
    while pid in ids:
        pid, n = f"{base}-{n}", n + 1

    body = sanitize(art["body"])
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    if words < 400:
        sys.exit(f"Draft too short ({words} words); nothing published.")
    if not re.search(r"<p[ >]", body):
        sys.exit("Draft has no paragraphs; nothing published.")
    today = datetime.now(timezone.utc)

    post = {
        "id": pid,
        "title": art["title"].strip()[:120],
        "badge": badge,
        "bc": bc,
        "cat": cat,
        "date": today.strftime("%b %d, %Y").replace(" 0", " "),
        "rt": f"{max(2, round(words / 200))} min",
        "desc": art["desc"].strip()[:240],
        "bg": re.sub(r"[^A-Z0-9-]", "", str(art["bg"]).upper())[:7] or "NEWS",
        "bgc": bgc,
        "tags": [str(t).strip()[:30] for t in art["tags"]][:6],
        "sources": sources,
        "draft_by": "article-bot",
        "body": "\n" + body,
    }
    posts.insert(0, post)
    with open(POSTS, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=1)

    with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a") as out:
        out.write(f"id={pid}\n")
        out.write(f"title={post['title']}\n")
    print(f"Drafted: {post['title']} ({words} words, id={pid})")


if __name__ == "__main__":
    main()
