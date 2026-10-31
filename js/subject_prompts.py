#!/usr/bin/env python3
"""
Per-subject prompt library. Each subject maps to a category;
each category has tailored rules; specific subjects have overrides.
"""

# ─── Category map ───
SUBJECT_CATEGORY = {
    # STEM (numbers, calculations, but SIMPLE)
    "mathematics":              "stem",
    "physics":                  "stem",
    "chemistry":                "stem",
    "biology":                  "stem",
    "agricultural-science":     "stem",

    # Commercial (business scenario + light arithmetic)
    "accounting":               "commercial",
    "principles-of-accounts":   "commercial",
    "commerce":                 "commercial",
    "economics":                "commercial",
    "insurance":                "commercial",

    # Language (words, grammar, comprehension)
    "english-language":         "language",
    "french":                   "language",
    "arabic":                   "language",
    "hausa":                    "language",
    "igbo":                     "language",
    "yoruba":                   "language",

    # Humanities (facts, concepts, no numbers)
    "government":               "humanities",
    "civic-education":          "humanities",
    "history":                  "humanities",
    "literature-in-english":    "humanities",
    "christian-religious-studies": "humanities",
    "islamic-studies":          "humanities",
    "geography":                "humanities",
    "music":                    "humanities",
    "fine-art":                 "humanities",
    "physical-health-education":"humanities",
}


# ─── Universal hard rules applied to every question ───
UNIVERSAL_RULES = """STRICT RULES (apply to every question):
- Question stem MUST be under 120 characters. Aim for under 90.
- Each option must be ONE number, word, or very short phrase (under 30 characters).
- NEVER write questions that require paper working, multi-step algebra, long multiplication, long division, or fractions with non-simple denominators.
- If a calculation is unavoidable, it MUST be doable mentally or with ONE calculator operation using small round numbers.
- Distractors must be plausible but clearly wrong to a prepared student.
- Avoid "all of the above" / "none of the above" options.
- Each explanation is 1–2 short sentences.
- Vary difficulty: mostly medium, some easy, a few hard.
- Do NOT repeat the same concept across questions in the same set."""


# ─── Category-specific tone ───
CATEGORY_TONE = {
    "stem": """This is a SCIENCE / MATHEMATICS subject.
- Prioritise conceptual questions ("which principle explains…", "what is the unit of…", "which of these is …").
- When numeric, use SINGLE-STEP calculations only. Examples of acceptable math:
    • 6 × 7   • 3 / 4   • 25% of 40   • 2 + 3 − 1   • a simple substitution like v = u + at with small integers
- Numbers should be small and clean (1-digit to 3-digit integers, simple percentages like 10/25/50%).
- DO NOT include proofs, derivations, or questions requiring intermediate working lines.""",

    "commercial": """This is a BUSINESS / COMMERCIAL subject.
- Prefer short real-world scenario questions ("A trader buys ... what is the profit?", "Which document is used when…").
- Numeric questions must use SINGLE-STEP arithmetic (one addition, one percentage, one subtraction).
- Use clean numbers: prices like ₦100, ₦500, ₦2,000; percentages like 5%, 10%, 20%.
- DO NOT require the student to prepare a full ledger, trial balance, or multi-journal entry on paper.""",

    "language": """This is a LANGUAGE subject.
- Test vocabulary, grammar, idioms, tone marking, verb conjugation, comprehension micro-passages (under 40 words), or synonyms.
- NEVER include calculations.
- Prefer short excerpts and questions about meaning and usage over literary analysis.
- SCRIPT LOCK: Use ONLY Latin characters with standard diacritics for Yoruba/Igbo/Hausa (ẹ, ọ, ṣ, à, á, ẹ̀, ọ̀, ṣ̀). Use ONLY Latin characters with French accents for French (é, è, ê, ç, à). Use ONLY Arabic script (with harakat) for Arabic. NEVER mix scripts (no Hebrew, Chinese, Cyrillic, or Latin-in-Arabic or any cross-script contamination).""",

    "humanities": """This is a HUMANITIES subject.
- Test factual recall, definitions, causes and effects, principles, and dates/people/events.
- NEVER include calculations.
- Prefer conceptual clarity over rote memorisation where possible.
- Keep stems under 100 characters when you can.""",
}


# ─── Subject-specific overrides (added on top of category tone) ───
SUBJECT_OVERRIDES = {
    "mathematics": "Stick to 1-step arithmetic or direct formula substitution. Avoid 'prove that' and 'simplify fully'.",
    "physics":     "Use g = 10 m/s² if gravity is needed. One formula application per question maximum. Avoid multi-stage momentum-energy chains.",
    "chemistry":   "Use whole-number moles only. Avoid multi-step stoichiometry. Prefer qualitative questions where possible.",
    "biology":     "Prefer definition, function, and identification questions. Avoid numeric genetics problems that need a Punnett square on paper.",
    "economics":   "Single-step elasticity, simple interest, or percentage questions only. Avoid multi-curve graph reading.",
    "accounting":  "Prefer 'what is the treatment of X' over full ledger reconstruction. Numeric items should be simple additions/subtractions.",
    "french":      "Include accent marks (é, è, ê, ç, à, etc.) correctly.",
    "arabic":      "Include short transliterations where helpful. Test grammar, vocabulary, and comprehension.",
    "igbo":        "Include proper tone marks (ọ, ụ, ị, ṅ) and diacritics.",
    "yoruba":      "Include proper tone marks (ẹ, ọ, ṣ) and diacritics.",
    "hausa":       "Include proper special characters (ɓ, ɗ, ƙ) where relevant.",
    "fine-art":    "Prefer identification and definition. Skip long art criticism.",
    "music":       "Prefer theory, rudiments, and instrument identification. Skip score reading.",
    "physical-health-education": "Prefer rules, definitions, and body-system identification over complex biomechanics.",
    "history":     "Focus on dates, eras, people, and cause/effect. No numbers other than years.",
    "literature-in-english": "Use short excerpts. Test theme, character, and device identification, not long analysis.",
    "government":  "Focus on institutions, roles, concepts, and processes.",
    "geography":   "Use qualitative descriptions. Avoid map calculation unless 1-step.",
}


def _subject_tone(slug: str) -> str:
    cat = SUBJECT_CATEGORY.get(slug, "humanities")
    tone = CATEGORY_TONE[cat]
    override = SUBJECT_OVERRIDES.get(slug)
    if override:
        tone += f"\n- SUBJECT-SPECIFIC: {override}"
    return tone


def subtopic_prompt(subject_slug: str, subject_name: str, topic: str, count: int) -> str:
    return f"""You are an expert on the Nigerian JAMB UTME {subject_name} syllabus.

For the topic **{topic}**, list {count} subtopics that JAMB examiners test.

Rules:
- Return exactly {count} subtopics.
- Each subtopic must be specific enough to write at least 5 distinct, SHORT questions on.
- No overlaps. No broader-than-topic items.
- For language subjects, you may use native terms (e.g. "Akaye", "Grammaire").
- Return strictly a JSON array of strings. No prose."""


def question_prompt(
    subject_slug: str,
    subject_name: str,
    topic: str,
    subtopic: str,
    count: int,
) -> str:
    tone = _subject_tone(subject_slug)
    return f"""You are an experienced JAMB UTME {subject_name} examiner writing SHORT practice questions.

Generate exactly {count} unique multiple-choice questions on the subtopic **{subtopic}** (under the topic **{topic}**).

{tone}

{UNIVERSAL_RULES}

Return strictly JSON matching the schema. No prose, no markdown."""
