#!/usr/bin/env python3
"""
Derive per-topic weights for every subject.

Strategy per subject:
  1. If topic has a real percentage → use it
  2. Else if curriculum exists → weight = subtopic count for that topic
  3. Else → equal weight across topics

Output: jd/weights.json
{
  "mathematics": {
    "source": "curriculum" | "ai" | "equal" | "mixed",
    "topics": [
      {"name": "Algebra", "weight": 17.3, "percentage": 17.3},
      ...
    ]
  },
  ...
}
"""

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
TOPICS_DIR = JD_DIR / "topics"
CURRICULUM_DIR = JD_DIR / "curriculum"
SUBJECTS_FILE = JD_DIR / "subjects.json"
OUT_FILE = JD_DIR / "weights.json"


def curriculum_subtopic_counts(slug: str) -> dict[str, int]:
    """Count total subtopics per topicName from the curriculum file."""
    path = CURRICULUM_DIR / f"{slug}.json"
    if not path.exists():
        return {}
    rows = json.loads(path.read_text()).get("curriculum", [])
    if not isinstance(rows, list):
        return {}
    counts: Counter = Counter()
    for row in rows:
        topic_name = row.get("topicName") or row.get("topic")
        if not topic_name:
            continue
        subs = row.get("subtopics") or []
        # Each curriculum row contributes at least 1 unit of weight
        counts[topic_name] += max(len(subs), 1)
    return dict(counts)


def normalize(items: list[dict], key: str) -> list[dict]:
    total = sum(max(i[key], 0) for i in items) or 1
    for i in items:
        i["percentage"] = round(max(i[key], 0) / total * 100, 2)
    return items


def derive_subject(slug: str) -> dict:
    topics_path = TOPICS_DIR / f"{slug}.json"
    if not topics_path.exists():
        return {"error": "no topics file"}

    payload = json.loads(topics_path.read_text())
    topics = payload.get("topics", [])
    if not topics:
        return {"error": "empty topics"}

    # --- Tier 1: real percentages already present (AI-seeded) ---
    present = [t for t in topics if t.get("percentage") is not None]
    if present and len(present) == len(topics):
        derived = [{"name": t["name"], "weight": float(t["percentage"])} for t in topics]
        return {"source": "ai", "topics": normalize(derived, "weight")}

    # --- Tier 2: curriculum subtopic counts ---
    curr_counts = curriculum_subtopic_counts(slug)
    if curr_counts:
        derived = []
        for t in topics:
            w = curr_counts.get(t["name"], 0)
            derived.append({"name": t["name"], "weight": float(w)})
        if any(d["weight"] > 0 for d in derived):
            return {"source": "curriculum", "topics": normalize(derived, "weight")}

    # --- Tier 3: equal weights ---
    derived = [{"name": t["name"], "weight": 1.0} for t in topics]
    return {"source": "equal", "topics": normalize(derived, "weight")}


def main() -> int:
    if not SUBJECTS_FILE.exists():
        print(f"ERROR: {SUBJECTS_FILE} missing.", file=sys.stderr)
        return 1

    subjects = json.loads(SUBJECTS_FILE.read_text())
    out = {}

    print(f"{'SUBJECT':32s} {'src':12s} {'topics':>7s}  {'sum%':>6s}")
    print("-" * 64)

    for s in subjects:
        slug = s["slug"]
        result = derive_subject(slug)
        if "error" in result:
            print(f"{s['name']:32s} ! {result['error']}")
            continue
        out[slug] = result
        total = round(sum(t["percentage"] for t in result["topics"]), 1)
        print(f"{s['name']:32s} {result['source']:12s} {len(result['topics']):>7d}  {total:>6.1f}")

    OUT_FILE.write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"\n✅ Wrote {OUT_FILE.relative_to(ROOT)} ({len(out)} subjects)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
