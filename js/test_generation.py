#!/usr/bin/env python3
"""
Sample generator. Reads jd/generation_plan.json for exact counts,
uses subject-specific prompts from js/subject_prompts.py.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from subject_prompts import subtopic_prompt, question_prompt

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
BASE = "https://generativelanguage.googleapis.com/v1beta/models"

MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.7-flash",
]

RETRY_ATTEMPTS = 3
RETRY_BACKOFF = [2, 5, 10]

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
PLAN_FILE = JD_DIR / "generation_plan.json"

SUBTOPIC_SCHEMA = {"type": "ARRAY", "items": {"type": "STRING"}}

QUESTION_SCHEMA = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "question": {"type": "STRING"},
            "options": {
                "type": "OBJECT",
                "properties": {
                    "A": {"type": "STRING"},
                    "B": {"type": "STRING"},
                    "C": {"type": "STRING"},
                    "D": {"type": "STRING"},
                },
                "required": ["A", "B", "C", "D"],
            },
            "correct_answer": {"type": "STRING", "enum": ["A", "B", "C", "D"]},
            "explanation": {"type": "STRING"},
            "difficulty": {"type": "STRING", "enum": ["easy", "medium", "hard"]},
        },
        "required": ["question", "options", "correct_answer", "explanation", "difficulty"],
    },
}


def _call_once(model, prompt, schema, temperature):
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": schema,
            "temperature": temperature,
        },
    }
    r = requests.post(
        f"{BASE}/{model}:generateContent",
        params={"key": GEMINI_KEY},
        json=body,
        timeout=120,
    )
    if r.status_code == 404:
        raise LookupError(f"{model}: 404")
    if r.status_code in (429, 500, 502, 503, 504):
        raise ConnectionError(f"{model}: HTTP {r.status_code}")
    r.raise_for_status()
    payload = r.json()
    candidates = payload.get("candidates", [])
    if not candidates:
        raise RuntimeError(f"No candidates: {json.dumps(payload)[:200]}")
    parts = candidates[0].get("content", {}).get("parts", [])
    return json.loads("".join(p.get("text", "") for p in parts).strip())


def call_model(model, prompt, schema, temperature):
    last = None
    for attempt in range(RETRY_ATTEMPTS):
        try:
            return _call_once(model, prompt, schema, temperature)
        except (ConnectionError, requests.exceptions.Timeout) as exc:
            last = exc
            if attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_BACKOFF[attempt])
                continue
            raise
        except LookupError:
            raise
    raise last


def call_gemini(prompt, schema, temperature):
    errors = []
    for model in MODELS:
        try:
            return call_model(model, prompt, schema, temperature), model
        except Exception as exc:
            errors.append(f"{model}: {exc}")
    raise RuntimeError("All models failed → " + " | ".join(errors))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--subject", required=True)
    ap.add_argument("--topic", required=True)
    ap.add_argument("--test-subtopics", type=int, default=2)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not GEMINI_KEY:
        print("ERROR: GEMINI_API_KEY not set.", file=sys.stderr)
        return 1
    if not PLAN_FILE.exists():
        print(f"ERROR: {PLAN_FILE} missing. Run plan_generation.py first.", file=sys.stderr)
        return 1

    plan = json.loads(PLAN_FILE.read_text())
    if args.subject not in plan:
        print(f"ERROR: subject '{args.subject}' not in plan.", file=sys.stderr)
        print("Available:", ", ".join(sorted(plan.keys())))
        return 1

    subj_block = plan[args.subject]
    topic_plan = next(
        (t for t in subj_block["topics"] if t["name"].lower() == args.topic.lower()),
        None,
    )
    if not topic_plan:
        print(f"ERROR: topic '{args.topic}' not found.", file=sys.stderr)
        print("Available topics:")
        for t in subj_block["topics"]:
            print(f"  {t['name']:35s}  {t['weight_percentage']:>5}%  "
                  f"subs={t['subtopics_count']}  q/sub={t['questions_per_subtopic']}")
        return 1

    print("=" * 78)
    print(f" SUBJECT:  {subj_block['name']}  ({args.subject})")
    print(f" TOPIC:    {topic_plan['name']}")
    print(f" TARGET:   {topic_plan['target']} questions")
    print(f" PLAN:     {topic_plan['subtopics_count']} subtopics × "
          f"questions {topic_plan['questions_per_subtopic']}")
    print("=" * 78)

    if args.dry_run:
        print("\n[DRY RUN] — plan only, no Gemini calls.")
        return 0

    # Step 1: subtopics
    print(f"\n[1/2] Generating {topic_plan['subtopics_count']} subtopics …")
    try:
        subtopics, m = call_gemini(
            subtopic_prompt(args.subject, subj_block["name"], topic_plan["name"],
                            topic_plan["subtopics_count"]),
            SUBTOPIC_SCHEMA, 0.3,
        )
    except Exception as exc:
        print(f"  ❌ FAILED: {exc}")
        return 1
    print(f"  ✓ {len(subtopics)} subtopics via {m}\n")
    for i, s in enumerate(subtopics, 1):
        qn = topic_plan["questions_per_subtopic"][i - 1] if i - 1 < len(topic_plan["questions_per_subtopic"]) else "?"
        print(f"    {i}. {s}   ({qn} q)")

    # Step 2: sample questions
    n_test = min(args.test_subtopics, len(subtopics))
    print(f"\n[2/2] Generating questions for {n_test} sample subtopic(s) …\n")

    all_q = []
    for idx in range(n_test):
        sub = subtopics[idx]
        target = topic_plan["questions_per_subtopic"][idx] if idx < len(topic_plan["questions_per_subtopic"]) else 5
        print(f"  ── {idx + 1}. {sub}   (asking for {target}) ──")
        try:
            qs, m = call_gemini(
                question_prompt(args.subject, subj_block["name"], topic_plan["name"], sub, target),
                QUESTION_SCHEMA, 0.5,
            )
        except Exception as exc:
            print(f"     ❌ FAILED: {exc}\n")
            continue
        print(f"     ({len(qs)} received via {m})\n")
        for q in qs:
            print(f"     Q: {q['question']}")
            for opt, text in q["options"].items():
                mk = "✓" if opt == q["correct_answer"] else " "
                print(f"        {mk} {opt}) {text}")
            print(f"     ✔ Answer: {q['correct_answer']}")
            print(f"     💡 {q['explanation']}")
            print(f"     🎯 {q['difficulty']}\n")
            all_q.append(q)
        print()

    # Summary
    print("=" * 78)
    if all_q:
        avg_len = sum(len(q["question"]) for q in all_q) // len(all_q)
        diff = {"easy": 0, "medium": 0, "hard": 0}
        for q in all_q:
            diff[q["difficulty"]] += 1
        print(f" SUMMARY: {len(all_q)} questions")
        print(f"  Avg question length:   {avg_len} chars  (target ≤ 90)")
        print(f"  Longest question:      {max(len(q['question']) for q in all_q)} chars")
        print(f"  Difficulty:            easy={diff['easy']}  medium={diff['medium']}  hard={diff['hard']}")
        print(f"  Topic total planned:   {topic_plan['target']}  ({topic_plan['subtopics_count']} subs)")
        print(f"  Subject total planned: {subj_block['planned_total']}")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
