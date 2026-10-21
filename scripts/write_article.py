#!/usr/bin/env python3
"""Nagcoop article bot (free: Google Gemini API free tier).

Writes ONE new blog article and adds it to the top of posts.json. The workflow
then publishes it straight to the site.
Uses the free tier of the Google Gemini API (key from aistudio.google.com,
no credit card). Standard library only.

Env:
  GEMINI_API_KEY  required (GitHub secret)
  TOPIC           optional; if empty, the bot picks a story from news.json
  MODEL           optional; defaults to gemini-2.5-flash
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MODEL = os.environ.get("MODEL") or "gemini-2.5-flash"
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


FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"]


def _request(model, prompt, token):
    body = {
        "model": model,
        "temperature": 0.7,
        "max_tokens": 3000,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
