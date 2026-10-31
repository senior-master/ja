#!/usr/bin/env python3
"""
Fetch deep JAMB curriculum (Bloom's, objectives, weights) from ALOC.
Writes: jd/curriculum/<subject_slug>.json
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE_URL = "https://dev.aloc.com.ng/api/v1"
API_KEY  = os.environ.get("ALOC_API_KEY", "").strip()

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
CURRICULUM_DIR = JD_DIR / "curriculum"
SUBJECTS_FILE = JD_DIR / "subjects.json"

HEADERS = {
    "X-API-Key": API_KEY,
    "Accept": "application/json",
}

def fetch_curriculum(subject_slug: str) -> dict:
    url = f"{BASE_URL}/curriculum"
    params = {"subject": subject_slug, "examType": "jamb"}
    r = requests.get(url, headers=HEADERS, params=params, timeout=60)
    r.raise_for_status()
    payload = r.json()
    data = payload.get("data", payload)

    return {
        "subject_slug": subject_slug,
        "exam_type": "jamb",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "curriculum": data,
    }

def main() -> int:
    if not API_KEY:
        print("ERROR: ALOC_API_KEY is not set.", file=sys.stderr)
        return 1

    if not SUBJECTS_FILE.exists():
        print(f"ERROR: {SUBJECTS_FILE} not found. Run fetch_syllabus.py first.", file=sys.stderr)
        return 1

    CURRICULUM_DIR.mkdir(parents=True, exist_ok=True)
    subjects = json.loads(SUBJECTS_FILE.read_text())

    for s in subjects:
        slug = s["slug"]
        print(f"Fetching curriculum for {slug} (3 credits) …")
        try:
            doc = fetch_curriculum(slug)
        except Exception as exc:
            print(f"  ! skipped {slug}: {exc}", file=sys.stderr)
            continue

        out = CURRICULUM_DIR / f"{slug}.json"
        out.write_text(
            json.dumps(doc, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"  → saved → {out.relative_to(ROOT)}")

    print("Done.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
