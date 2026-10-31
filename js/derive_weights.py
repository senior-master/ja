#!/usr/bin/env python3
"""
Derive per-topic weights + question counts (target: 1000 questions/subject).

Strategies per subject (in priority):
  1. AI-supplied percentages (from fetch_ai_topics.py)
  2. Curriculum matching (direct → alias → subtopic → floor)
  3. Equal weights (last resort)

Output: jd/weights.json
  { "<slug>": {
       "source": "curriculum" | "ai" | "equal",
       "target_questions": 1000,
       "topics": [
         {"name": "...", "weight": <float>, "percentage": <float>, "question_count": <int>},
         ...
       ]
    }, ... }
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
TOPICS_DIR = JD_DIR / "topics"
CURRICULUM_DIR = JD_DIR / "curriculum"
SUBJECTS_FILE = JD_DIR / "subjects.json"
OUT_FILE = JD_DIR / "weights.json"

FLOOR_FACTOR = 0.25
TARGET_PER_SUBJECT = 500

# Manual alias map: our topic name (normalized) → curriculum topicName it belongs under
ALIAS_MAP = {
    "physics": {
        "atomic structure":   "modern physics",
        "electromagnetism":   "electricity",
        "energy":             "mechanics",
        "gas laws thermal":   "heat",
        "gravitation":        "mechanics",
        "magnetism":          "electricity",
        "momentum":           "mechanics",
        "optics":             "waves",
        "pressure":           "mechanics",
        "states of matter":   "heat",
        "work energy power":  "mechanics",
    },
}


def norm(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    s = re.sub(r"[\-_/&]", " ", s)
    s = re.sub(r"\band\b", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    return re.sub(r"\s+", " ", s).strip()


def build_curriculum_index(slug: str):
    path = CURRICULUM_DIR / f"{slug}.json"
    if not path.exists():
        return {}, {}
    rows = json.loads(path.read_text()).get("curriculum", [])
    if not isinstance(rows, list):
        return {}, {}

    topic_weight = {}
    subtopic_parent = {}
    for row in rows:
        tname = row.get("topicName") or row.get("topic")
        if not tname:
            continue
        tnorm = norm(tname)
        subs = row.get("subtopics") or []
        topic_weight[tnorm] = topic_weight.get(tnorm, 0) + max(len(subs), 1)
        for sub in subs:
            if isinstance(sub, str):
                subtopic_parent[norm(sub)] = (tnorm, max(len(subs), 1))
    return topic_weight, subtopic_parent


def normalize_list(items):
    total = sum(max(i["weight"], 0) for i in items) or 1
    for i in items:
        i["percentage"] = round(max(i["weight"], 0) / total * 100, 2)
    drift = round(100.0 - sum(i["percentage"] for i in items), 2)
    if abs(drift) > 0 and items:
        biggest = max(items, key=lambda x: x["percentage"])
        biggest["percentage"] = round(biggest["percentage"] + drift, 2)
    return items


def distribute_questions(items, target=TARGET_PER_SUBJECT):
    """Largest-remainder method so question_count sums exactly to target."""
    raw = [target * i["percentage"] / 100.0 for i in items]
    floors = [int(r) for r in raw]
    remainders = sorted(range(len(items)), key=lambda i: raw[i] - floors[i], reverse=True)

    deficit = target - sum(floors)
    for i in remainders[:deficit]:
        floors[i] += 1

    # Guarantee min 1 for any topic with non-zero percentage
    for i, item in enumerate(items):
        if floors[i] == 0 and item["percentage"] > 0:
            biggest = max(range(len(items)), key=lambda x: floors[x])
            if floors[biggest] > 1:
                floors[biggest] -= 1
                floors[i] = 1

    for item, cnt in zip(items, floors):
        item["question_count"] = cnt
    return items


def derive_subject(slug: str) -> dict:
    tp = TOPICS_DIR / f"{slug}.json"
    if not tp.exists():
        return {"error": "no topics file"}
    topics = json.loads(tp.read_text()).get("topics", [])
    if not topics:
        return {"error": "empty topics"}

    # Tier 1: AI-supplied percentages
    present = [t for t in topics if t.get("percentage") is not None]
    if present and len(present) == len(topics):
        derived = [{"name": t["name"], "weight": float(t["percentage"])} for t in topics]
        derived = normalize_list(derived)
        distribute_questions(derived)
        return {"source": "ai", "target_questions": TARGET_PER_SUBJECT, "topics": derived}

    # Tier 2: curriculum matching
    topic_weight, subtopic_parent = build_curriculum_index(slug)
    if topic_weight:
        aliases = ALIAS_MAP.get(slug, {})
        derived = []
        matched_weights = []

        for t in topics:
            n = norm(t["name"])
            w = 0.0
            if n in topic_weight:
                w = float(topic_weight[n])
            elif n in aliases:
                parent_w = topic_weight.get(norm(aliases[n]), 0)
                if parent_w > 0:
                    w = parent_w / 2.0
            elif n in subtopic_parent:
                parent_norm, sibling_count = subtopic_parent[n]
                parent_w = topic_weight.get(parent_norm, 0)
                if parent_w > 0 and sibling_count > 0:
                    w = parent_w / sibling_count

            derived.append({"name": t["name"], "weight": w})
            if w > 0:
                matched_weights.append(w)

        if matched_weights:
            mean_w = sum(matched_weights) / len(matched_weights)
            floor = mean_w * FLOOR_FACTOR
            rescued = []
            for d in derived:
                if d["weight"] == 0:
                    d["weight"] = floor
                    rescued.append(d["name"])
            derived = normalize_list(derived)
            distribute_questions(derived)
            result = {
                "source": "curriculum",
                "target_questions": TARGET_PER_SUBJECT,
                "topics": derived,
            }
            if rescued:
                result["rescued_by_floor"] = rescued
            return result

    # Tier 3: equal
    derived = [{"name": t["name"], "weight": 1.0} for t in topics]
    derived = normalize_list(derived)
    distribute_questions(derived)
    return {"source": "equal", "target_questions": TARGET_PER_SUBJECT, "topics": derived}


def main() -> int:
    if not SUBJECTS_FILE.exists():
        print(f"ERROR: {SUBJECTS_FILE} missing.", file=sys.stderr)
        return 1

    subjects = json.loads(SUBJECTS_FILE.read_text())
    out = {}

    print(f"{'SUBJECT':30s} {'src':11s} {'topics':>6s}  {'sum%':>6s}  {'sum_q':>6s}  rescued")
    print("-" * 82)

    for s in subjects:
        slug = s["slug"]
        r = derive_subject(slug)
        if "error" in r:
            print(f"{s['name']:30s} ! {r['error']}")
            continue
        out[slug] = r
        total_pct = round(sum(t["percentage"] for t in r["topics"]), 1)
        total_q = sum(t["question_count"] for t in r["topics"])
        rescued = len(r.get("rescued_by_floor", []))
        print(f"{s['name']:30s} {r['source']:11s} {len(r['topics']):>6d}  {total_pct:>6.1f}  {total_q:>6d}  {rescued or ''}")

    OUT_FILE.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n✅ Wrote {OUT_FILE.relative_to(ROOT)} ({len(out)} subjects × {TARGET_PER_SUBJECT} questions)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
