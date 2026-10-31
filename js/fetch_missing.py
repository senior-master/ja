#!/usr/bin/env python3
"""
Probe and fetch curriculum for the missing JAMB subjects (fixed probe).
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE_URL = "https://dev.aloc.com.ng/api/v1"
API_KEY  = os.environ.get("ALOC_API_KEY", "").strip()

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
TOPICS_DIR = JD_DIR / "topics"
CURRICULUM_DIR = JD_DIR / "curriculum"
SUBJECTS_FILE = JD_DIR / "subjects.json"

HEADERS = {"X-API-Key": API_KEY, "Accept": "application/json"}

CANDIDATES = [
    ("Agricultural Science",      ["agricultural-science"]),
    ("Arabic",                    ["arabic"]),
    ("Fine Art",                  ["art", "fine-art"]),
    ("French",                    ["french"]),
    ("Hausa",                     ["hausa"]),
    ("Home Economics",            ["home-economics"]),
    ("Igbo",                      ["igbo"]),
    ("Islamic Studies",           ["islamic-studies"]),
    ("Music",                     ["music"]),
    ("Physical Health Education", ["physical-health-education", "phe", "physical-and-health-education"]),
    ("Yoruba",                    ["yoruba"]),
]


def _clean_topics(raw_list):
    return [
        {
            "id": idx,
            "name": t.get("displayName") or t.get("name") or t.get("topicName") or t.get("topic"),
            "percentage": t.get("percentage") or t.get("weight"),
            "difficulty": t.get("avgDifficulty") or t.get("difficulty"),
        }
        for idx, t in enumerate(raw_list, start=1)
    ]


def _derive_topics_from_curriculum(curr_rows):
    seen = {}
    for item in curr_rows:
        tn = item.get("topicName") or item.get("topic")
        if tn and tn not in seen:
            seen[tn] = {"id": len(seen) + 1, "name": tn, "percentage": None, "difficulty": None}
    return list(seen.values())


def probe_subject(slug):
    """
    Returns (topics_list, curriculum_list_or_None).
    (None, None) means the slug does not exist anywhere.
    """
    # 1) Try the free /topics endpoint
    try:
        r = requests.get(f"{BASE_URL}/subjects/{slug}/topics", headers=HEADERS, timeout=30)
        if r.status_code == 200:
            payload = r.json()
            data = payload.get("data", payload)
            raw = data.get("topics", data) if isinstance(data, dict) else data
            if isinstance(raw, list) and len(raw) > 0:
                return _clean_topics(raw), None
    except Exception:
        pass

    # 2) Fallback: /curriculum (3 credits if it returns data, free on 404)
    try:
        r = requests.get(
            f"{BASE_URL}/curriculum",
            params={"subject": slug, "examType": "jamb"},
            headers=HEADERS, timeout=60,
        )
        if r.status_code == 200:
            payload = r.json()
            data = payload.get("data", payload)
            if isinstance(data, list) and len(data) > 0:
                return _derive_topics_from_curriculum(data), data
    except Exception:
        pass

    return None, None


def fetch_curriculum(slug):
    r = requests.get(
        f"{BASE_URL}/curriculum",
        params={"subject": slug, "examType": "jamb"},
        headers=HEADERS, timeout=60,
    )
    r.raise_for_status()
    payload = r.json()
    data = payload.get("data", payload)
    return data if isinstance(data, list) else []


def main() -> int:
    if not API_KEY:
        print("ERROR: ALOC_API_KEY is not set.", file=sys.stderr)
        return 1
    if not SUBJECTS_FILE.exists():
        print(f"ERROR: {SUBJECTS_FILE} missing.", file=sys.stderr)
        return 1

    subjects = json.loads(SUBJECTS_FILE.read_text())
    existing_slugs = {s["slug"] for s in subjects}
    next_id = max((s["id"] for s in subjects), default=0) + 1

    added, skipped, failed, no_curr = [], [], [], []
    credits_used = 0

    for display_name, variants in CANDIDATES:
        if any(v in existing_slugs for v in variants):
            print(f"⏭  {display_name}: already present, skipping")
            skipped.append(display_name)
            continue

        resolved_slug, topics_raw, curriculum_raw = None, None, None
        for v in variants:
            print(f"🔍 probing {v} …", end=" ", flush=True)
            topics_raw, curriculum_raw = probe_subject(v)
            if topics_raw:
                print(f"✓ {len(topics_raw)} topics")
                resolved_slug = v
                break
            print("✗")

        if not resolved_slug:
            print(f"❌ {display_name}: no working slug\n")
            failed.append(display_name)
            continue

        # If the probe returned curriculum already, we saved 3 credits
        if curriculum_raw is None:
            print(f"📥 curriculum for {resolved_slug} (3 credits) …", end=" ", flush=True)
            try:
                curriculum_raw = fetch_curriculum(resolved_slug)
                credits_used += 3
            except Exception as exc:
                print(f"FAILED ({exc})")
                curriculum_raw = []
            print(f"✓ {len(curriculum_raw)} rows")

        if not curriculum_raw:
            no_curr.append(display_name)
            # still save topics, but skip empty curriculum file
            (TOPICS_DIR / f"{resolved_slug}.json").write_text(
                json.dumps({
                    "subject_slug": resolved_slug, "exam_type": "jamb",
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                    "topics": topics_raw,
                }, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
        else:
            CURRICULUM_DIR.mkdir(parents=True, exist_ok=True)
            (CURRICULUM_DIR / f"{resolved_slug}.json").write_text(
                json.dumps({
                    "subject_slug": resolved_slug, "exam_type": "jamb",
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                    "curriculum": curriculum_raw,
                }, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            (TOPICS_DIR / f"{resolved_slug}.json").write_text(
                json.dumps({
                    "subject_slug": resolved_slug, "exam_type": "jamb",
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                    "topics": topics_raw,
                }, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )

        subjects.append({"id": next_id, "name": display_name, "slug": resolved_slug})
        next_id += 1
        added.append((display_name, resolved_slug))
        print()
        time.sleep(0.5)

    subjects.sort(key=lambda s: s["id"])
    SUBJECTS_FILE.write_text(
        json.dumps(subjects, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print("\n=== SUMMARY ===")
    print(f"✅ Added:             {len(added)}")
    for name, slug in added:
        print(f"     {name}  →  {slug}")
    print(f"⏭  Skipped:           {len(skipped)}")
    print(f"❌ Not in ALOC:       {len(failed)}")
    for name in failed:
        print(f"     {name}")
    if no_curr:
        print(f"⚠️  No curriculum data: {len(no_curr)}  (topics saved anyway)")
        for name in no_curr:
            print(f"     {name}")
    print(f"\n💳 Extra credits this run: ~{credits_used}")
    print(f"📊 Total subjects now:     {len(subjects)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
