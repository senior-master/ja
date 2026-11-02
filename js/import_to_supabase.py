#!/usr/bin/env python3
"""
Import jq/**/*.jsonl into Supabase — resumable, time-boxed.

Tracks per-file completion in jd/import_progress.json.
Skips files already imported (instant, no API calls).
Respects RUN_BUDGET env var (default 180s = 3 min).
Exits 0 cleanly on budget expiry so cron-job.org keeps triggering.

Usage:
  python js/import_to_supabase.py                    # resume import
  python js/import_to_supabase.py --subject physics  # force recheck one subject
  python js/import_to_supabase.py --verify           # print DB count only
  python js/import_to_supabase.py --reset            # clear progress (start fresh)
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JQ_DIR = ROOT / "jq"
PROGRESS_FILE = ROOT / "jd" / "import_progress.json"

# Load .env.supabase for local tests
env_file = ROOT / ".env.supabase"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
RUN_BUDGET = int(os.environ.get("RUN_BUDGET", "180"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "500"))
SAFETY_MARGIN = 8


def fail(msg):
    print(f"❌ {msg}", file=sys.stderr)
    sys.exit(1)


if not SUPABASE_URL or not SERVICE_KEY:
    fail("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

TABLE_URL = f"{SUPABASE_URL}/rest/v1/questions"


def load_progress():
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass
    return {"completed_files": [], "inserted_total": 0, "skipped_total": 0}


def save_progress(progress):
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2) + "\n")


def row_from(rec):
    return {
        "subject_slug": rec["subject_slug"],
        "topic": rec["topic"],
        "subtopic": rec["subtopic"],
        "question": rec["question"],
        "option_a": rec["options"]["A"],
        "option_b": rec["options"]["B"],
        "option_c": rec["options"]["C"],
        "option_d": rec["options"]["D"],
        "correct_answer": rec["correct_answer"],
        "explanation": rec.get("explanation"),
        "difficulty": rec.get("difficulty"),
        "model": rec.get("model"),
        "generated_at": rec.get("generated_at"),
    }


def _post(rows):
    """Post batch. Returns inserted count only (skips = len - inserted)."""
    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(TABLE_URL, data=body, method="POST")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=ignore-duplicates,return=representation")

    with urllib.request.urlopen(req, timeout=60) as resp:
        return len(json.loads(resp.read().decode("utf-8")))


def insert_batch(rows):
    """Returns (inserted, skipped). Handles 409/413/5xx gracefully."""
    try:
        ins = _post(rows)
        return ins, len(rows) - ins
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")[:300]

        # ── Auth: fatal, don't retry ──
        if e.code in (401, 403):
            print(f"\n🚨 HTTP {e.code} — auth/permission fatal", file=sys.stderr)
            print(f"   {err}", file=sys.stderr)
            print("   Fix: run GRANT in Supabase SQL Editor.", file=sys.stderr)
            sys.exit(2)

        # ── 413 payload too large: split and retry ──
        if e.code == 413 and len(rows) > 1:
            mid = len(rows) // 2
            i1, s1 = insert_batch(rows[:mid])
            i2, s2 = insert_batch(rows[mid:])
            return i1 + i2, s1 + s2

        # ── 409 conflict: fall back to row-by-row (mostly dupes) ──
        if e.code == 409:
            ins, skp = 0, 0
            for row in rows:
                try:
                    ins += _post([row])
                except Exception:
                    skp += 1
            return ins, skp

        # ── 5xx transient: cap retry at 20 rows, rest counted as skip ──
        if e.code >= 500:
            ins, skp = 0, 0
            for row in rows[:20]:
                try:
                    ins += _post([row])
                except Exception:
                    skp += 1
            skp += max(0, len(rows) - 20)
            return ins, skp

        print(f"\n🚨 HTTP {e.code} unexpected: {err}", file=sys.stderr)
        sys.exit(2)


def import_file(path, deadline):
    """Returns (inserted, skipped, bad_rows, finished_bool)."""
    rows, bad = [], 0
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(row_from(json.loads(line)))
        except (KeyError, json.JSONDecodeError):
            bad += 1
    if not rows:
        return 0, 0, bad, True

    ins_total, skp_total = 0, 0
    for i in range(0, len(rows), BATCH_SIZE):
        if time.time() >= deadline:
            return ins_total, skp_total, bad, False   # not finished
        ins, skp = insert_batch(rows[i:i + BATCH_SIZE])
        ins_total += ins
        skp_total += skp
    return ins_total, skp_total, bad, True


def verify_count():
    url = f"{TABLE_URL}?select=id&limit=1"
    req = urllib.request.Request(url, method="HEAD")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Prefer", "count=exact")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"✅ Total in Supabase: {resp.headers.get('Content-Range')}")
    except urllib.error.HTTPError as e:
        fail(f"verify failed: {e.code} {e.read().decode('utf-8', errors='replace')[:200]}")


def main():
    if "--verify" in sys.argv:
        verify_count()
        return 0

    if "--reset" in sys.argv:
        if PROGRESS_FILE.exists():
            PROGRESS_FILE.unlink()
            print("🔄 Progress reset.")
        else:
            print("ℹ️  No progress file.")
        return 0

    if not JQ_DIR.exists():
        fail(f"{JQ_DIR} not found")

    subject_filter = None
    if "--subject" in sys.argv:
        idx = sys.argv.index("--subject")
        if idx + 1 < len(sys.argv):
            subject_filter = sys.argv[idx + 1]

    progress = load_progress()
    completed = set(progress["completed_files"])

    files = sorted(JQ_DIR.rglob("*.jsonl"))
    if subject_filter:
        files = [f for f in files if f"/{subject_filter}/" in str(f)]

    todo = [f for f in files if str(f.relative_to(JQ_DIR)) not in completed]
    already_done = len(files) - len(todo)

    print(f"📂 {len(files)} files total · {already_done} already done · {len(todo)} to do")
    if subject_filter:
        print(f"   (filtered: {subject_filter})")
    if not todo:
        print("✅ Nothing to do — all files imported.")
        verify_count()
        return 0

    start = time.time()
    deadline = start + RUN_BUDGET
    print(f"⏱️  Budget: {RUN_BUDGET}s\n")

    total_ins = total_skp = total_bad = 0
    files_done_this_run = 0

    for idx, path in enumerate(todo, 1):
        if time.time() >= deadline - SAFETY_MARGIN:
            print(f"\n⏹  Budget expiry — stopping after {files_done_this_run} files")
            break

        rel = str(path.relative_to(JQ_DIR))
        try:
            ins, skp, bad, finished = import_file(path, deadline)
        except SystemExit:
            raise
        except Exception as exc:
            print(f"  ❌ [{idx}/{len(todo)}] {rel}: {exc}", file=sys.stderr)
            continue

        total_ins += ins
        total_skp += skp
        total_bad += bad
        elapsed = time.time() - start
        rate = total_ins / max(elapsed, 1)
        print(f"  [{idx:>3}/{len(todo)}] {rel:52s} +{ins:>4d} skip:{skp:>2d} ({rate:.0f} q/s)")

        if finished:
            completed.add(rel)
            files_done_this_run += 1
            progress["completed_files"] = sorted(completed)
            progress["inserted_total"] += ins
            progress["skipped_total"] += skp
            save_progress(progress)

    elapsed = time.time() - start
    print()
    print("=" * 64)
    print(f"✅ This run: +{total_ins} inserted, {total_skp} skipped, {total_bad} bad")
    print(f"📊 Cumulative: {progress['inserted_total']} inserted, {progress['skipped_total']} skipped")
    print(f"📁 Files done: {len(completed)}/{len(files)}")
    print(f"⏱️  Elapsed: {elapsed:.1f}s ({total_ins / max(elapsed, 1):.0f} q/s)")
    print("=" * 64)
    return 0


if __name__ == "__main__":
    sys.exit(main())
