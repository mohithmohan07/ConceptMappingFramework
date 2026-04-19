"""
One-off: export Excel rows to JSON for the concept-mapping demo.
Run from repo root: python scripts/excel_to_json.py <path-to-xlsx> [out.json]
"""
import json
import sys
from pathlib import Path

import pandas as pd


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python excel_to_json.py <input.xlsx> [output.json]")
        sys.exit(1)
    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("public/data/concepts.json")

    df = pd.read_excel(src)
    # Normalize column names to match app Row type
    rename = {
        "Chapter Title": "chapterTitle",
        "Parent Concept": "parentConcept",
        "Display Name": "displayName",
        "Concept Description": "conceptDescription",
        "Chapter No": "chapterNo",
    }
    df = df.rename(columns=rename)
    out.parent.mkdir(parents=True, exist_ok=True)
    # pandas to_json encodes NaN as null (valid JSON); re-parse for pretty-print
    records = json.loads(df.to_json(orient="records", force_ascii=False))
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} rows to {out}")


if __name__ == "__main__":
    main()
