# ja — JAMB Question Engine

Pipeline:
1. Fetch subjects + topics + weights (JSON files in `jd/`)
2. Generate practice questions (future, output in `jq/`)
3. Serve via app/API

Folders:
- `jd/` — syllabus data
- `js/` — Python scripts
- `jq/` — generated questions
- `jw/` — workflow drafts
- `.github/workflows/` — live GitHub Actions
