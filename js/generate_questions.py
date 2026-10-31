#!/usr/bin/env python3
"""
Mass question generator — multi-key rotation, time-boxed, resumable.
Saves questions to jq/<subject>/<topic>.jsonl (JSONL — one question per line).
"""

import json
import os
import re
import sys
import time
from pathlib import Path

import requests

# Make sibling modules importable regardless of CWD
sys.path.insert(0, str(Path(__file__).resolve().parent))

from subject_prompts import subtopic_prompt, question_prompt

GEMINI_KEYS = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", "").split(",") if k.strip()]
RUN_BUDGET = int(os.environ.get("RUN_BUDGET", "360"))
SAFETY_MARGIN = 35

BASE = "https://generativelanguage.googleapis.com/v1beta/models"
MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite",
          "gemini-2.5-flash-lite", "gemini-flash-lite-latest"]

ROOT = Path(__file__).resolve().parent.parent
JD_DIR = ROOT / "jd"
JQ_DIR = ROOT / "jq"
PLAN_FILE = JD_DIR / "generation_plan.json"
PROGRESS_FILE = JD_DIR / "generation_progress.json"
SUBJECTS_FILE = JD_DIR / "subjects.json"

SUBTOPIC_SCHEMA = {"type": "ARRAY", "items": {"type": "STRING"}}
QUESTION_SCHEMA = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "question": {"type": "STRING"},
            "options": {"type": "OBJECT", "properties": {
                "A": {"type": "STRING"}, "B": {"type": "STRING"},
                "C": {"type": "STRING"}, "D": {"type": "STRING"}},
                "required": ["A", "B", "C", "D"]},
            "correct_answer": {"type": "STRING", "enum": ["A", "B", "C", "D"]},
            "explanation": {"type": "STRING"},
            "difficulty": {"type": "STRING", "enum": ["easy", "medium", "hard"]},
        },
        "required": ["question", "options", "correct_answer", "explanation", "difficulty"],
    },
}


class AllKeysCoolingDown(Exception):
    def __init__(self, wait_seconds):
        self.wait_seconds = wait_seconds
        super().__init__(f"all keys cooling ({wait_seconds:.0f}s)")


class RateLimited(Exception): pass
class TransientError(Exception): pass
class ModelUnavailable(Exception): pass


class KeyRotator:
    """Rotate keys; on 429 escalate cooldown exponentially per-key."""
    def __init__(self, keys):
        if not keys:
            raise ValueError("no keys")
        self.keys = list(keys)
        self.index = 0
        self.cooldowns = {}
        self.hits = {}

    def next_key(self):
        now = time.time()
        for _ in range(len(self.keys)):
            key = self.keys[self.index]
            self.index = (self.index + 1) % len(self.keys)
            if self.cooldowns.get(key, 0) <= now:
                return key
        earliest = min(self.cooldowns.values()) if self.cooldowns else now
        raise AllKeysCoolingDown(earliest - now)

    def cool_down(self, key):
        n = self.hits.get(key, 0) + 1
        self.hits[key] = n
        # 60s, 180s, 540s, 1620s, 3600s (1 hour, capped)
        seconds = min(60 * (3 ** (n - 1)), 3600)
        self.cooldowns[key] = time.time() + seconds
        print(f"    🧊 key #{self.keys.index(key)} cooled {seconds}s (hit #{n})")


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def load_json(path, default=None):
    return json.loads(path.read_text()) if path.exists() else (default or {})


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def qhash(q):
    return f"{q['question']}|{q['options']['A']}"


def load_hashes(path):
    if not path.exists():
        return set()
    s = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            s.add(qhash(json.loads(line)))
        except Exception:
            continue
    return s


def append_line(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def call_gemini(rotator, model, prompt, schema, temperature, timeout):
    key = rotator.next_key()
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": schema,
            "temperature": temperature,
        },
    }
    try:
        r = requests.post(f"{BASE}/{model}:generateContent",
                          params={"key": key}, json=body, timeout=timeout)
    except requests.exceptions.Timeout:
        raise TransientError(f"timeout ({timeout}s)")
    if r.status_code == 429:
        rotator.cool_down(key)
        raise RateLimited()
    if r.status_code == 404:
        raise ModelUnavailable(model)
    if r.status_code in (500, 502, 503, 504):
        raise TransientError(f"HTTP {r.status_code}")
    r.raise_for_status()
    payload = r.json()
    cand = payload.get("candidates", [])
    if not cand:
        raise TransientError("no candidates")
    parts = cand[0].get("content", {}).get("parts", [])
    return json.loads("".join(p.get("text", "") for p in parts).strip()), model


def call_with_rotation(rotator, prompt, schema, temperature, timeout):
    last_err = None
    for model in MODELS:
        for _ in range(len(rotator.keys) * 2):
            try:
                return call_gemini(rotator, model, prompt, schema, temperature, timeout)
            except ModelUnavailable:
                break
            except (RateLimited, TransientError) as exc:
                last_err = exc
    if isinstance(last_err, RateLimited):
        rotator.next_key()  # will raise AllKeysCoolingDown if needed
    raise last_err or RuntimeError("all attempts failed")


def plan_subtopic_questions(n_subtopics, target):
    if n_subtopics == 0:
        return []
    base = target // n_subtopics
    rem = target - base * n_subtopics
    counts = [base + (1 if i < rem else 0) for i in range(n_subtopics)]
    return [min(c, 15) for c in counts]


PROGRESS = {}


def process_one_topic(rotator, slug, subject_name, topic_row, topic_progress, remaining):
    topic_name = topic_row["name"]
    topic_key = slugify(topic_name)

    if not topic_progress["subtopics"]:
        rem = remaining()
        if rem < 45:
            return False
        timeout = min(60, max(15, int(rem) - SAFETY_MARGIN - 5))
        subs, model = call_with_rotation(
            rotator,
            subtopic_prompt(slug, subject_name, topic_name, topic_row["subtopics_count"]),
            SUBTOPIC_SCHEMA, 0.3, timeout,
        )
        topic_progress["subtopics"] = subs
        topic_progress["questions_per_subtopic"] = plan_subtopic_questions(len(subs), topic_row["target"])
        save_json(PROGRESS_FILE, PROGRESS)
        print(f"    📝 {slug}/{topic_name}: {len(subs)} subtopics via {model}")
        return True

    done_set = set(topic_progress["subtopics_done"])
    for idx, sub in enumerate(topic_progress["subtopics"]):
        if sub in done_set:
            continue
        rem = remaining()
        if rem < 45:
            return False
        count = (topic_progress["questions_per_subtopic"][idx]
                 if idx < len(topic_progress["questions_per_subtopic"]) else 5)
        timeout = min(60, max(15, int(rem) - SAFETY_MARGIN - 5))
        qs, model = call_with_rotation(
            rotator,
            question_prompt(slug, subject_name, topic_name, sub, count),
            QUESTION_SCHEMA, 0.5, timeout,
        )
        jl = JQ_DIR / slug / f"{topic_key}.jsonl"
        hashes = load_hashes(jl)
        new = 0
        for q in qs:
            h = qhash(q)
            if h in hashes:
                continue
            hashes.add(h)
            append_line(jl, {**q, "subject_slug": slug, "topic": topic_name,
                             "subtopic": sub, "model": model,
                             "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
            new += 1
        topic_progress["subtopics_done"].append(sub)
        topic_progress["questions_generated"] += new
        save_json(PROGRESS_FILE, PROGRESS)
        print(f"    🧠 {slug}/{topic_name}/{sub[:30]}: +{new}/{len(qs)} ({model})")
        return True

    topic_progress["complete"] = True
    save_json(PROGRESS_FILE, PROGRESS)
    return False


def main():
    if not GEMINI_KEYS:
        print("ERROR: GEMINI_API_KEYS empty", file=sys.stderr)
        return 1
    if not PLAN_FILE.exists():
        print(f"ERROR: {PLAN_FILE} missing", file=sys.stderr)
        return 1

    global PROGRESS
    PROGRESS = load_json(PROGRESS_FILE, {})

    plan = load_json(PLAN_FILE)
    subject_names = {s["slug"]: s["name"] for s in load_json(SUBJECTS_FILE, [])}
    rotator = KeyRotator(GEMINI_KEYS)
    start = time.time()
    deadline = start + RUN_BUDGET

    def remaining():
        return deadline - time.time()

    print(f"▶️  {len(GEMINI_KEYS)} keys · budget {RUN_BUDGET}s")

    work = []
    for slug, block in plan.items():
        sp = PROGRESS.setdefault(slug, {"topics": {}})
        for tr in block["topics"]:
            tp = sp["topics"].setdefault(tr["name"], {
                "subtopics": [], "questions_per_subtopic": [],
                "subtopics_done": [], "questions_generated": 0, "complete": False,
            })
            if not tp.get("complete"):
                work.append((slug, block, tr, tp))

    print(f"    queue: {len(work)} topics remaining")

    generated = 0
    consecutive_errors = 0
    idx = 0

    while remaining() > SAFETY_MARGIN and work:
        slug, block, tr, tp = work[idx]
        before = tp["questions_generated"]
        try:
            made = process_one_topic(rotator, slug, subject_names.get(slug, slug),
                                     tr, tp, remaining)
            delta = tp["questions_generated"] - before
            generated += delta
            if delta > 0 or made:
                consecutive_errors = 0
            else:
                consecutive_errors += 1
            if tp.get("complete"):
                work.pop(idx)
                if idx >= len(work):
                    idx = 0
            else:
                idx = (idx + 1) % max(len(work), 1)
            if not made and remaining() <= SAFETY_MARGIN:
                break
        except AllKeysCoolingDown as exc:
            if exc.wait_seconds > remaining() - SAFETY_MARGIN:
                print(f"⏹  all keys cooling {exc.wait_seconds:.0f}s > budget — exiting")
                break
            wait = min(exc.wait_seconds, 15)
            print(f"⏸  sleeping {wait:.0f}s (all keys cooling)")
            time.sleep(wait)
            consecutive_errors += 1
        except Exception as exc:
            consecutive_errors += 1
            print(f"❌ {slug}/{tr['name']}: {exc}")
            idx = (idx + 1) % max(len(work), 1)
            time.sleep(1)

        if consecutive_errors >= 15 and generated == 0:
            print(f"⏹  15 consecutive failures with no progress — exiting cleanly")
            break

    save_json(PROGRESS_FILE, PROGRESS)
    elapsed = int(time.time() - start)
    print(f"\n✅ done: +{generated} questions, {elapsed}s used")
    return 0   # ALWAYS 0 — cron-job.org must keep triggering


if __name__ == "__main__":
    raise SystemExit(main())
