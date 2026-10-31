#!/usr/bin/env python3
"""
Bootstrap topic lists for the 10 subjects not in ALOC, using Gemini.
Loops through a priority list of models so a single failure doesn't kill the run.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
BASE       = "https://generativelanguage.googleapis.com/v1beta/models"

# Priority order — first success wins per subject
MODELS = [
    "gemini-2.5-flash",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
]

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
TOPICS_DIR = JD_DIR / "topics"
SUBJECTS_FILE = JD_DIR / "subjects.json"

MISSING = [
    ("Arabic",                    "arabic"),
    ("Fine Art",                  "fine-art"),
    ("French",                    "french"),
    ("Hausa",                     "hausa"),
    ("Home Economics",            "home-economics"),
    ("Igbo",                      "igbo"),
    ("Islamic Studies",           "islamic-studies"),
    ("Music",                     "music"),
    ("Physical Health Education", "physical-health-education"),
    ("Yoruba",                    "yoruba"),
]

RESPONSE_SCHEMA = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "topic":      {"type": "STRING"},
            "percentage": {"type": "NUMBER"},
        },
        "required": ["topic", "percentage"],
    },
}


def build_prompt(subject_name: str) -> str:
    return f"""You are an expert on the Nigerian JAMB UTME syllabus.

List the major topics covered in the JAMB UTME subject: **{subject_name}**.

Rules:
- Return 8 to 20 topics — only the major, examinable topics.
- Use the same topic names JAMB would use (concise, e.g. "Vectors", "Chemical Bonding").
- Assign each topic an integer `percentage` (1–100). All percentages for this subject must sum to exactly 100.
- Base percentages on how frequently the topic appears in JAMB past questions.
- Do not include subtopics, definitions, or explanations. Topic names only.
- Return strictly valid JSON matching the schema. No prose, no markdown.
"""


def call_model(model: str, subject_name: str) -> list[dict]:
    body = {
        "contents": [{"parts": [{"text": build_prompt(subject_name)}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
            "temperature": 0.3,
        },
    }
    r = requests.post(
        f"{BASE}/{model}:generateContent",
        params={"key": GEMINI_KEY},
        json=body,
        timeout=90,
    )

    if r.status_code == 404:
        raise LookupError(f"404 model not found: {model}")
    if r.status_code in (429, 500, 502, 503, 504):
        raise ConnectionError(f"HTTP {r.status_code} transient error")
    r.raise_for_status()

    payload = r.json()
    candidates = payload.get("candidates", [])
    if not candidates:
        raise RuntimeError(f"No candidates: {json.dumps(payload)[:200]}")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts).strip()

    try:
        topics = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Non-JSON: {text[:150]}") from exc

    if not isinstance(topics, list) or not topics:
        raise RuntimeError(f"Empty/invalid topics")
    return topics


def call_gemini(subject_name: str) -> tuple[list[dict], str]:
    """Try each model in order. Returns (topics, model_used)."""
    errors = []
    for model in MODELS:
        try:
            topics = call_model(model, subject_name)
            return topics, model
        except Exception as exc:
            errors.append(f"{model}: {exc}")
            continue
    raise RuntimeError("All models failed → " + " | ".join(errors))


def normalize_weights(topics: list[dict]) -> list[dict]:
    total = sum(float(t.get("percentage") or 0) for t in topics) or 1.0
    out = []
    for idx, t in enumerate(topics, start=1):
        out.append({
            "id": idx,
            "name": t["topic"].strip(),
            "percentage": round(float(t["percentage"]) / total * 100, 2),
            "difficulty": None,
        })
    return out


def main() -> int:
    if not GEMINI_KEY:
        print("ERROR: GEMINI_API_KEY is not set.", file=sys.stderr)
        return 1
    if not SUBJECTS_FILE.exists():
        print(f"ERROR: {SUBJECTS_FILE} missing.", file=sys.stderr)
        return 1

    subjects = json.loads(SUBJECTS_FILE.read_text())
    existing_slugs = {s["slug"] for s in subjects}
    next_id = max((s["id"] for s in subjects), default=0) + 1

    TOPICS_DIR.mkdir(parents=True, exist_ok=True)
    added, failed = [], []

    for display_name, slug in MISSING:
        if slug in existing_slugs:
            print(f"⏭  {display_name}: already present")
            continue
        # skip if file already exists (from a partial earlier run)
        if (TOPICS_DIR / f"{slug}.json").exists():
            print(f"⏭  {display_name}: file exists, skipping")
            subjects.append({"id": next_id, "name": display_name, "slug": slug})
            next_id += 1
            continue

        print(f"🤖 {display_name} …", end=" ", flush=True)
        try:
            raw_topics, model_used = call_gemini(display_name)
        except Exception as exc:
            print(f"FAILED ({exc})")
            failed.append((display_name, str(exc)))
            continue

        topics = normalize_weights(raw_topics)
        out = TOPICS_DIR / f"{slug}.json"
        out.write_text(
            json.dumps({
                "subject_slug": slug,
                "exam_type": "jamb",
                "source": "ai_generated",
                "model": model_used,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "topics": topics,
            }, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"✓ {len(topics)} topics via {model_used}")

        subjects.append({"id": next_id, "name": display_name, "slug": slug})
        next_id += 1
        added.append((display_name, slug, model_used))
        time.sleep(1)

    subjects.sort(key=lambda s: s["id"])
    SUBJECTS_FILE.write_text(
        json.dumps(subjects, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print("\n=== SUMMARY ===")
    print(f"✅ Added:   {len(added)}")
    for name, slug, model in added:
        print(f"     {name:28s} → {slug:28s} ({model})")
    print(f"❌ Failed:  {len(failed)}")
    for name, err in failed:
        print(f"     {name}: {err}")
    print(f"\n📊 Total subjects now: {len(subjects)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
