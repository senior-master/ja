#!/usr/bin/env python3
"""
One-time cleanup: REPLACE contaminated topics with real ones.
(idempotent — safe to re-run)
"""

import json
from datetime import datetime, timezone
from pathlib import Path

TOPICS = Path(__file__).resolve().parent.parent / "jd" / "topics"


def load(slug):
    return json.loads((TOPICS / f"{slug}.json").read_text())


def save(slug, data):
    data["fetched_at"] = datetime.now(timezone.utc).isoformat()
    data["cleaned"] = True
    (TOPICS / f"{slug}.json").write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    )


def renumber(topics):
    for i, t in enumerate(topics, start=1):
        t["id"] = i
    return topics


# ── 1. HISTORY: fully replace (all original topics were wrong) ──
d = load("history")
d["topics"] = renumber([
    {"name": "Nigeria: Earliest Times to 1800", "percentage": 20, "difficulty": None},
    {"name": "Nigeria in the 19th Century",     "percentage": 20, "difficulty": None},
    {"name": "Nigeria 1900–1960",               "percentage": 20, "difficulty": None},
    {"name": "Nigeria Since Independence",      "percentage": 20, "difficulty": None},
    {"name": "West Africa and the Wider World", "percentage": 20, "difficulty": None},
])
d["source"] = "manual"
save("history", d)
print(f"✅ history: {len(d['topics'])} topics (manual)")

# ── 2. INSURANCE: fully replace ──
d = load("insurance")
d["topics"] = renumber([
    {"name": "Principles of Insurance",       "percentage": 20, "difficulty": None},
    {"name": "Types of Insurance",            "percentage": 25, "difficulty": None},
    {"name": "Insurance Contracts",           "percentage": 20, "difficulty": None},
    {"name": "Risk Management",               "percentage": 20, "difficulty": None},
    {"name": "Insurance Regulation in Nigeria","percentage": 15, "difficulty": None},
])
d["source"] = "manual"
save("insurance", d)
print(f"✅ insurance: {len(d['topics'])} topics (manual)")

# ── 3. CRS: replace 4 bad with 4 real CRS topics ──
d = load("christian-religious-studies")
BAD = {"quran", "islamic religious studies", "islamic history", "civic education"}
kept = [t for t in d["topics"] if t["name"].lower().strip() not in BAD]
NEW_CRS = [
    "Biblical Themes and Theology",
    "Christian Ethics and Morality",
    "History of the Christian Church",
    "Christian Doctrines and Beliefs",
]
for name in NEW_CRS:
    kept.append({"name": name, "percentage": None, "difficulty": None})
d["topics"] = renumber(kept)
save("christian-religious-studies", d)
print(f"✅ christian-religious-studies: {len(d['topics'])} topics (replaced 4, kept 4, added 4)")

# ── 4. CIVIC EDUCATION: replace 4 bad with 4 real civic topics ──
d = load("civic-education")
BAD = {"geography", "government", "economics", "mathematics"}
kept = [t for t in d["topics"] if t["name"].lower().strip() not in BAD]
NEW_CIVIC = [
    "Human Rights and Rule of Law",
    "Political Participation",
    "Social Values and Norms",
    "Constitutional Development in Nigeria",
]
for name in NEW_CIVIC:
    kept.append({"name": name, "percentage": None, "difficulty": None})
d["topics"] = renumber(kept)
save("civic-education", d)
print(f"✅ civic-education: {len(d['topics'])} topics (replaced 4, kept 4, added 4)")

# ── 5. ECONOMICS: merge macro typo variants (already fixed, kept idempotent) ──
d = load("economics")
seen = set()
merged = []
for t in d["topics"]:
    n = t["name"].lower().strip().replace(" ", "")
    if n in ("macroecnomics", "macro economics", "macroeconomics"):
        if "macroeconomics" in seen:
            continue
        t["name"] = "Macroeconomics"
        seen.add("macroeconomics")
    merged.append(t)
d["topics"] = renumber(merged)
save("economics", d)
print(f"✅ economics: {len(d['topics'])} topics (deduped macro)")
