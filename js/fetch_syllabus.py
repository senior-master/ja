#!/usr/bin/env python3
"""
Fetch JAMB subjects, topics and topic weightage from ALOC Station API.
Writes:
  jd/subjects.json
  jd/topics/<subject_slug>.json
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE_URL = "https://aloc.com.ng/api/v1"
API_KEY  = os.environ.get("ALOC_API_KEY", "").strip()

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
TOPICS_DIR = JD_DIR / "topics"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json",
}


def fetch_subjects() -> list[dict]:
    url = f"{BASE_URL}/benchmarks/subjects"
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    payload = r.json()

    # ALOC wraps data in {"data": [...]} — adjust if your response shape differs.
    subjects = payload.get("data", payload)
    if not isinstance(subjects, list):
        raise RuntimeError(f"Unexpected subjects payload: {type(subjects)}")

    cleaned = []
    for idx, s in enumerate(subjects, start=1):
        # Keep only the fields we care about — mirrors future DB columns.
        cleaned.append(
            {
                "id": idx,
                "name": s.get("name") or s.get("displayName"),
                "slug": s.get("slug") or s.get("name", "").lower().replace(" ", "-"),
            }
        )
    return cleaned


def fetch_topics(subject_slug: str) -> dict:
    url = f"{BASE_URL}/benchmarks/topics"
    params = {"subject": subject_slug, "examType": "jamb"}
    r = requests.get(url, headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    payload = r.json()

    data = payload.get("data", payload)
    raw_topics = data.get("topics", data) if isinstance(data, dict) else data
    if not isinstance(raw_topics, list):
        raise RuntimeError(f"Unexpected topics payload for {subject_slug}: {type(raw_topics)}")

    topics = []
    for idx, t in enumerate(raw_topics, start=1):
        topics.append(
            {
                "id": idx,
                "name": t.get("displayName") or t.get("name"),
                "percentage": t.get("percentage"),
                "difficulty": t.get("avgDifficulty") or t.get("difficulty"),
            }
        )

    return {
        "subject_slug": subject_slug,
        "exam_type": "jamb",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "topics": topics,
    }


def main() -> int:
    if not API_KEY:
        print("ERROR: ALOC_API_KEY is not set.", file=sys.stderr)
        return 1

    JD_DIR.mkdir(parents=True, exist_ok=True)
    TOPICS_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching subjects …")
    subjects = fetch_subjects()
    (JD_DIR / "subjects.json").write_text(
        json.dumps(subjects, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"  → saved {len(subjects)} subjects")

    for s in subjects:
        slug = s["slug"]
        print(f"Fetching topics for {slug} …")
        try:
            doc = fetch_topics(slug)
        except Exception as exc:
            print(f"  ! skipped {slug}: {exc}", file=sys.stderr)
            continue

        out = TOPICS_DIR / f"{slug}.json"
        out.write_text(
            json.dumps(doc, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"  → saved {len(doc['topics'])} topics → {out.relative_to(ROOT)}")

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
