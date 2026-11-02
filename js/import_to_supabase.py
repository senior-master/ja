#!/usr/bin/env python3
"""
Import jq/**/*.jsonl into Supabase via PostgREST.
Stdlib only — no external deps (no pydantic/Rust build needed).

Usage:
  python js/import_to_supabase.py                   # import everything
  python js/import_to_supabase.py --subject mathematics  # one subject only
  python js/import_to_supabase.py --verify          # just print DB count
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

# Optional local .env.supabase (for Termux testing)
env_file = ROOT / ".env.supabase"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()

BATCH_SIZE = 200


def fail(msg):
    print(f"❌ {msg}", file=sys.stderr)
    sys.exit(1)


if not SUPABASE_URL or not SERVICE_KEY:
    fail("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

TABLE_URL = f"{SUPABASE_URL}/rest/v1/questions"


def row_from(rec):
    return {
        "subject_slug":   rec["subject_slug"],
        "topic":          rec["topic"],
        "subtopic":       rec["subtopic"],
        "question":       rec["question"],
        "option_a":       rec["options"]["A"],
        "option_b":       rec["options"]["B"],
        "option_c":       rec["options"]["C"],
        "option_d":       rec["options"]["D"],
        "correct_answer": rec["correct_answer"],
        "explanation":    rec.get("explanation"),
        "difficulty":     rec.get("difficulty"),
        "model":          rec.get("model"),
        "generated_at":   rec.get("generated_at"),
    }


def insert_batch(rows):
    """POST batch. Returns (inserted, skipped)."""
    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(TABLE_URL, data=body, method="POST")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=ignore-duplicates,return=representation")

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            inserted = json.loads(resp.read().decode("utf-8"))
            return len(inserted), len(rows) - len(inserted)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:400]

        # ── Auth/permission errors: fail fast, no retries ──
        if e.code in (401, 403):
            print(f"\n🚨 HTTP {e.code} — FATAL (auth/permission)", file=sys.stderr)
            print(f"   {err_body}", file=sys.stderr)
            print("   Fix: run GRANT statements in Supabase SQL Editor.", file=sys.stderr)
            print("   Then rerun this workflow.", file=sys.stderr)
            sys.exit(2)

        # ── Schema errors (column doesn't exist, etc.): also fatal ──
        if e.code == 400 and "column" in err_body.lower():
            print(f"\n🚨 HTTP 400 schema mismatch", file=sys.stderr)
            print(f"   {err_body}", file=sys.stderr)
            sys.exit(2)

        # ── Payload too large: split batch in half and retry ──
        if e.code == 413 and len(rows) > 1:
            mid = len(rows) // 2
            i1, s1 = insert_batch(rows[:mid])
            i2, s2 = insert_batch(rows[mid:])
            return i1 + i2, s1 + s2

        # ── Transient (5xx): fall back to row-by-row, but with a cap ──
        if e.code >= 500:
            print(f"    ⚠️  batch HTTP {e.code} — trying row-by-row (cap 20): {err_body[:150]}")
            ins, skp = 0, 0
            for row in rows[:20]:
                try:
                    single = urllib.request.Request(
                        TABLE_URL, data=json.dumps([row]).encode("utf-8"), method="POST"
                    )
                    single.add_header("apikey", SERVICE_KEY)
                    single.add_header("Authorization", f"Bearer {SERVICE_KEY}")
                    single.add_header("Content-Type", "application/json")
                    single.add_header("Prefer", "resolution=ignore-duplicates,return=representation")
                    with urllib.request.urlopen(single, timeout=15) as r:
                        if len(json.loads(r.read().decode("utf-8"))) > 0:
                            ins += 1
                        else:
                            skp += 1
                except Exception:
                    skp += 1
            skp += max(0, len(rows) - 20)   # count remainder as skipped
            return ins, skp

        # ── Unknown 4xx: fail the whole import ──
        print(f"\n🚨 HTTP {e.code} unexpected: {err_body}", file=sys.stderr)
        sys.exit(2)
    except urllib.error.URLError as e:
        fail(f"network error reaching Supabase: {e.reason}")
    except TimeoutError:
        fail("request timed out — check connection / firewall")


def import_file(path):
    """Returns (inserted, skipped, bad_rows)."""
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
        return 0, 0, bad

    ins_total, skp_total = 0, 0
    for i in range(0, len(rows), BATCH_SIZE):
        ins, skp = insert_batch(rows[i:i + BATCH_SIZE])
        ins_total += ins
        skp_total += skp
    return ins_total, skp_total, bad


def verify_count():
    url = f"{TABLE_URL}?select=id&limit=1"
    req = urllib.request.Request(url, method="HEAD")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Prefer", "count=exact")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"✅ Total questions in Supabase: {resp.headers.get('Content-Range')}")
    except urllib.error.HTTPError as e:
        fail(f"verify failed: {e.code} {e.read().decode('utf-8', errors='replace')[:200]}")


def main():
    if "--verify" in sys.argv:
        verify_count()
        return 0

    if not JQ_DIR.exists():
        fail(f"{JQ_DIR} not found")

    subject_filter = None
    if "--subject" in sys.argv:
        idx = sys.argv.index("--subject")
        if idx + 1 < len(sys.argv):
            subject_filter = sys.argv[idx + 1]

    files = sorted(JQ_DIR.rglob("*.jsonl"))
    if subject_filter:
        files = [f for f in files if f"/{subject_filter}/" in str(f)]
    if not files:
        fail("no JSONL files matched")

    print(f"📂 {len(files)} JSONL files to import")
    if subject_filter:
        print(f"   (filtered to subject: {subject_filter})")
    print()

    total_ins = total_skp = total_bad = 0
    start = time.time()

    for idx, path in enumerate(files, 1):
        rel = path.relative_to(JQ_DIR)
        try:
            ins, skp, bad = import_file(path)
        except Exception as exc:
            print(f"  ❌ [{idx:>3}/{len(files)}] {rel}: {exc}", file=sys.stderr)
            continue
        total_ins += ins
        total_skp += skp
        total_bad += bad
        elapsed = time.time() - start
        rate = total_ins / max(elapsed, 1)
        print(f"  [{idx:>3}/{len(files)}] {str(rel):48s} +{ins:>4d}  skip:{skp:>2d}  ({rate:.0f} q/s)")

    elapsed = time.time() - start
    print()
    print("=" * 64)
    print(f"✅ Inserted: {total_ins:,}")
    print(f"⏭️  Skipped:  {total_skp:,}  (duplicates)")
    print(f"⚠️  Bad rows: {total_bad:,}  (malformed JSONL)")
    print(f"⏱️  Elapsed:  {elapsed:.1f}s  ({total_ins / max(elapsed, 1):.0f} q/s)")
    print("=" * 64)
    return 0


if __name__ == "__main__":
    sys.exit(main())
