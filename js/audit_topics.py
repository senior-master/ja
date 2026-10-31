#!/usr/bin/env python3
"""
Audit topic lists across all 27 subjects.

Flags:
  - Topics whose name matches ANOTHER subject (cross-contamination like Chemistry-in-Physics)
  - Topics with 0 question_count (would generate no questions)
  - Subjects whose total questions != 1000
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
TOPICS_DIR = JD_DIR / "topics"
SUBJECTS_FILE = JD_DIR / "subjects.json"
WEIGHTS_FILE = JD_DIR / "weights.json"


def main():
    subjects = json.loads(SUBJECTS_FILE.read_text())
    weights = json.loads(WEIGHTS_FILE.read_text()) if WEIGHTS_FILE.exists() else {}
    subject_lookup = {s["name"].lower().strip(): s for s in subjects}

    flagged = 0

    for s in subjects:
        slug = s["slug"]
        path = TOPICS_DIR / f"{slug}.json"
        print(f"\n━━━ {s['name']}  ({slug})  ━━━")
        if not path.exists():
            print("  🚨 FILE MISSING")
            flagged += 1
            continue

        data = json.loads(path.read_text())
        topics = data.get("topics", [])
        source = data.get("source", "aloc")
        wblock = weights.get(slug, {})
        wtopics = {t["name"]: t for t in wblock.get("topics", [])}
        total_q = sum(t.get("question_count", 0) for t in wtopics.values())

        print(f"  source: {source}  |  {len(topics)} topics  |  total questions: {total_q}")
        if total_q and total_q != 1000:
            print(f"  🚨 TOTAL QUESTIONS != 1000")
            flagged += 1

        for t in topics:
            name = t["name"]
            w = wtopics.get(name, {})
            q = w.get("question_count", "?")
            pct = w.get("percentage", "?")
            issues = []

            # Cross-contamination
            key = name.lower().strip()
            if key in subject_lookup and subject_lookup[key]["slug"] != slug:
                issues.append(f"⚠️ overlaps with subject '{subject_lookup[key]['name']}'")

            # Zero questions
            if isinstance(q, int) and q == 0:
                issues.append("🚨 0 questions")

            line = f"  • {name:35s} {pct:>5}%  q={q}"
            if issues:
                line += "  " + "  ".join(issues)
                flagged += 1
            print(line)

    print("\n" + "=" * 60)
    if flagged:
        print(f"⚠️  {flagged} warnings (mostly false-positive overlaps).")
    else:
        print("✅ No issues — all subjects clean.")
    return 0 if flagged == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
