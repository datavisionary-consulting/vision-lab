"""One-time migration: extract Spark/SQL embedded JSON from the legacy
index.html into the new unified per-course JSON files. Run once, then
verify counts (60 Spark questions, 26 SQL problems) before deleting.
"""
import json
import re
from pathlib import Path

LEGACY_HTML = Path(__file__).parent.parent / "index.html"
DATA_DIR = Path(__file__).parent / "public" / "data"


def extract_script_json(html, script_id):
    pattern = re.compile(
        r'<script type="application/json" id="' + re.escape(script_id) + r'">(.*?)</script>',
        re.DOTALL,
    )
    match = pattern.search(html)
    if not match:
        raise ValueError(f"script tag id={script_id!r} not found")
    return json.loads(match.group(1))


def migrate_spark(spark_questions):
    out = []
    for q in spark_questions:
        out.append({
            "id": q["id"],
            "level": q.get("level"),
            "level_name": q.get("level_name"),
            "topic": (q.get("topics") or [None])[0],
            "topics": q.get("topics", []),
            "question": q["front"],
            "options": q["options"],
            "correct": q["correct"],
            "theory": {"text": q.get("explanation", "")},
        })
    return out


def main():
    html = LEGACY_HTML.read_text(encoding="utf-8")

    sql_problems = extract_script_json(html, "sql-data")
    sql_sample = extract_script_json(html, "sql-sample")
    spark_questions_raw = extract_script_json(html, "spark-data")

    spark_questions = migrate_spark(spark_questions_raw)

    (DATA_DIR / "sql" / "problems.json").write_text(
        json.dumps(sql_problems, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (DATA_DIR / "sql" / "sample-data.json").write_text(
        json.dumps(sql_sample, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (DATA_DIR / "spark" / "questions.json").write_text(
        json.dumps(spark_questions, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"sql/problems.json: {len(sql_problems)} problems (expect 26)")
    print(f"spark/questions.json: {len(spark_questions)} questions (expect 60)")
    assert len(sql_problems) == 26, f"SQL problem count mismatch: {len(sql_problems)}"
    assert len(spark_questions) == 60, f"Spark question count mismatch: {len(spark_questions)}"
    print("OK: counts verified, zero loss.")


if __name__ == "__main__":
    main()
