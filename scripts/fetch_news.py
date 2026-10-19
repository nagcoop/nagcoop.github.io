#!/usr/bin/env python3
"""Nagcoop news bot.

Reads RSS/Atom feeds from gaming sites and writes news.json with the
headline, a short summary, source, date, image and a link to the original
story. Standard library only (nothing to install).
"""
import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

# Edit this list freely: (name shown on the site, feed URL)
FEEDS = [
    ("Time Extension",     "https://www.timeextension.com/feeds/latest"),
    ("RetroRGB",           "https://www.retrorgb.com/feed"),
    ("Nintendo Life",      "https://www.nintendolife.com/feeds/latest"),
    ("Push Square",        "https://www.pushsquare.com/feeds/latest"),
    ("Pure Xbox",          "https://www.purexbox.com/feeds/latest"),
    ("PC Gamer",           "https://www.pcgamer.com/rss/"),
    ("Rock Paper Shotgun", "https://www.rockpapershotgun.com/feed"),
    ("Polygon",            "https://www.polygon.com/rss/index.xml"),
    ("GamesRadar+",        "https://www.gamesradar.com/rss/"),
]

# Sources that mix games with movies, TV, etc.: only gaming stories get in
FILTER_SOURCES = {"Polygon", "GamesRadar+"}
GAME_WORDS = re.compile(
    r"\b(games?|gaming|gamers?|gameplay|video ?games?|consoles?|playstation|ps[2-5]|psn|"
    r"xbox|nintendo|switch|steam|epic games|dlc|remaster(?:ed)?|remake|"
    r"speedrun|e-?sports?|emulat\w*|retro|arcade|indie|rpg|jrpg|fps|mmo|"
    r"roguelike|roguelite|metroidvania|recomp\w*|pc port|patch|early access)\b",
    re.I,
)


def is_game_news(item):
    return bool(GAME_WORDS.search(item["title"] + " " + item["summary"]))

MAX_TOTAL = 30        # how many stories news.json keeps
MAX_PER_SOURCE = 6    # keeps a single source from dominating
SUMMARY_CHARS = 160   # short teaser: readers click through to the source
OUTPUT = "news.json"

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}
UA = "Mozilla/5.0 (compatible; NagcoopNewsBot/1.0; +https://nagcoop.github.io)"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def clean_text(raw):
    if not raw:
        return ""
    txt = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", raw, flags=re.S | re.I)
    txt = re.sub(r"<[^>]+>", " ", txt)
    txt = html.unescape(txt)
    return re.sub(r"\s+", " ", txt).strip()


def shorten(txt, n=SUMMARY_CHARS):
    if len(txt) <= n:
        return txt
    cut = txt[:n].rsplit(" ", 1)[0].rstrip(",.;:-–— ")
    return cut + "…"


def first_img(raw):
    m = re.search(r"<img[^>]+src=[\"']([^\"']+)[\"']", raw or "", re.I)
    return m.group(1) if m else ""


def parse_date(s):
    if not s:
        return None
    s = s.strip()
    try:
        d = email.utils.parsedate_to_datetime(s)  # RSS: "Mon, 19 Oct 2026 10:00:00 -0300"
    except (TypeError, ValueError):
        try:
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))  # Atom: ISO 8601
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)


def txt(el, path):
    found = el.find(path, NS)
    return (found.text or "").strip() if found is not None and found.text else ""


def media_img(el):
    for path in ("media:content", "media:thumbnail"):
        m = el.find(path, NS)
        if m is not None and m.get("url"):
            return m.get("url")
    enc = el.find("enclosure")
    if enc is not None and (enc.get("type") or "").startswith("image"):
        return enc.get("url", "")
    return ""


def parse_feed(source, data):
    root = ET.fromstring(data)
    items = []
    if root.tag.endswith("rss") or root.find("channel") is not None:
        for it in root.iter("item"):
            body = txt(it, "description") or txt(it, "content:encoded")
            items.append({
                "title": clean_text(txt(it, "title")),
                "link": txt(it, "link"),
                "date": parse_date(txt(it, "pubDate")),
                "summary": shorten(clean_text(body)),
                "image": media_img(it) or first_img(txt(it, "content:encoded") or body),
            })
    else:  # Atom (Blogger and friends)
        for it in root.findall("atom:entry", NS):
            link = ""
            for l in it.findall("atom:link", NS):
                if l.get("rel", "alternate") == "alternate" and l.get("href"):
                    link = l.get("href")
                    break
            body = txt(it, "atom:summary") or txt(it, "atom:content")
            img = media_img(it) or first_img(body)
            # Blogger serves tiny thumbs (s72-c); ask for a bigger one
            img = re.sub(r"/s\d+(-c)?/", "/s640/", img)
            img = re.sub(r"=s\d+(-c)?$", "=s640", img)
            items.append({
                "title": clean_text(txt(it, "atom:title")),
                "link": link,
                "date": parse_date(txt(it, "atom:published") or txt(it, "atom:updated")),
                "summary": shorten(clean_text(body)),
                "image": img,
            })
    out = []
    for i in items:
        if source in FILTER_SOURCES and not is_game_news(i):
            continue
        if i["title"] and i["link"].startswith("http"):
            i["source"] = source
            if i["image"] and not i["image"].startswith("https://"):
                i["image"] = ""  # skip http images (blocked on an https site)
            out.append(i)
    return out[:MAX_PER_SOURCE]


def main():
    all_items, failed = [], []
    for source, url in FEEDS:
        try:
            got = parse_feed(source, fetch(url))
            print(f"[ok]   {source}: {len(got)} items")
            all_items += got
        except Exception as e:
            print(f"[error] {source}: {e}", file=sys.stderr)
            failed.append(source)

    if not all_items:
        print("No stories fetched; news.json left unchanged.", file=sys.stderr)
        sys.exit(0)

    seen, uniq = set(), []
    for i in all_items:
        key = re.sub(r"\W+", "", i["title"].lower())
        if i["link"] in seen or key in seen:
            continue
        seen.update({i["link"], key})
        uniq.append(i)

    epoch = datetime(1970, 1, 1, tzinfo=timezone.utc)
    uniq.sort(key=lambda i: i["date"] or epoch, reverse=True)
    for i in uniq:
        i["date"] = i["date"].isoformat() if i["date"] else None

    data = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": uniq[:MAX_TOTAL],
    }
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"news.json: {len(data['items'])} stories ({len(failed)} sources failed)")


if __name__ == "__main__":
    main()
