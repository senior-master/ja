#!/usr/bin/env python3
"""
Compute exact subtopic/question plan per subject so that the total
questions per subject equals its weights.json target (500).

Writes: jd/generation_plan.json
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
WEIGHTS_FILE = JD_DIR / "weights.json"
SUBJECTS_FILE = JD_DIR / "subjects.json"
OUT_FILE = JD_DIR / "generation_plan.json"

MAX_Q_PER_SUBTOPIC = 10   # higher than this degrades Gemini quality
MIN_SUBTOPICS_PER_TOPIC = 3
MAX_SUBTOPICS_PER_TOPIC = 20


def plan_topic(target: int) -> dict:
    """Return {subtopics: N, questions_per_subtopic: [int,...]} summing exactly to target."""
    if target < 1:
        return {"subtopics": 0, "questions_per_subtopic": [], "total": 0}
    if target < MIN_SUBTOPICS_PER_TOPIC:
        return {"subtopics": 1, "questions_per_subtopic": [target], "total": target}

    # Base subtopic count: aim for ≤ MAX_Q_PER_SUBTOPIC questions each
    subs = math.ceil(target / MAX_Q_PER_SUBTOPIC)
    subs = max(MIN_SUBTOPICS_PER_TOPIC, min(MAX_SUBTOPICS_PER_TOPIC, subs))

    # Largest-remainder distribution so counts sum exactly to target
    base = target // subs
    rem = target - base * subs
    counts = [base + (1 if i < rem else 0) for i in range(subs)]
    return {"subtopics": subs, "questions_per_subtopic": counts, "total": target}


def main() -> int:
    if not WEIGHTS_FILE.exists():
        print(f"ERROR: {WEIGHTS_FILE} missing.", file=sys.stderr)
        return 1
    weights = json.loads(WEIGHTS_FILE.read_text())
    subject_names = {s["slug"]: s["name"] for s in json.loads(SUBJECTS_FILE.read_text())} \
        if SUBJECTS_FILE.exists() else {}

    plan = {}
    grand_total = 0

    print(f"{'SUBJECT':32s} {'topics':>7s} {'subtotal':>9s} {'subs':>6s} {'buffer':>7s}")
    print("-" * 68)

    for slug, block in weights.items():
        target_subject = block.get("target_questions", 500)
        topics_plan = []
        subject_total = 0
        subject_subs = 0
        subject_buffer = 0
        for t in block["topics"]:
            p = plan_topic(t["question_count"])
            row = {
                "name": t["name"],
                "target": p["total"],
                "weight_percentage": t["percentage"],
                "subtopics_count": p["subtopics"],
                "questions_per_subtopic": p["questions_per_subtopic"],
            }
            topics_plan.append(row)
            subject_total += p["total"]
            subject_subs += p["subtopics"]
            subject_buffer += (p["subtopics"] * MAX_Q_PER_SUBTOPIC) - p["total"]

        plan[slug] = {
            "name": subject_names.get(slug, slug),
            "target_total": target_subject,
            "planned_total": subject_total,
            "subtopics_total": subject_subs,
            "topics": topics_plan,
        }
        grand_total += subject_total
        print(f"{slug:32s} {len(topics_plan):>7d} {subject_total:>9d} {subject_subs:>6d} {subject_buffer:>7d}")

    OUT_FILE.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("-" * 68)
    print(f"\n✅ Wrote {OUT_FILE.relative_to(ROOT)}")
    print(f"   Total questions across all subjects: {grand_total}")
    print(f"   Expected:                            {len(plan) * 500} (27 × 500)")
    ok = grand_total == len(plan) * 500
    print(f"   {'✅ MATCHES' if ok else '🚨 MISMATCH — investigate'}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
