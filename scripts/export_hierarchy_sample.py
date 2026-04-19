"""
Emit public/data/hierarchy-sample.json (first parent concept only) using the same
rules as src/data/transformToHierarchy.ts — for documentation / fixtures only.
"""
import json
import re
from pathlib import Path


def clean_trailing_code(label: str | None) -> str:
    if not label:
        return ""
    return re.sub(r"\s*\([^)]*\)\s*$", "", str(label)).strip()


def concept_label(row: dict) -> str:
    display = str(row.get("displayName") or row.get("Display Name") or "").strip()
    if display:
        return clean_trailing_code(display)
    raw = str(row.get("Concept") or "").strip()
    return clean_trailing_code(raw)


def grade_sort_key(grade: str) -> int:
    m = re.search(r"(\d+)", grade)
    return int(m.group(1)) if m else 10**9


def build(rows: list[dict]) -> list[dict]:
    seq = 0
    parents_m: dict[str, dict] = {}

    def touch_parent(n: str) -> dict:
        nonlocal seq
        if n not in parents_m:
            parents_m[n] = {"firstIndex": seq, "grades": {}}
            seq += 1
        return parents_m[n]

    def touch_grade(p: dict, g: str) -> dict:
        nonlocal seq
        if g not in p["grades"]:
            p["grades"][g] = {"firstIndex": seq, "chapters": {}}
            seq += 1
        return p["grades"][g]

    def touch_chapter(gr: dict, ch: str) -> dict:
        nonlocal seq
        if ch not in gr["chapters"]:
            gr["chapters"][ch] = {"firstIndex": seq, "topics": {}}
            seq += 1
        return gr["chapters"][ch]

    def touch_topic(c: dict, top: str) -> dict:
        nonlocal seq
        if top not in c["topics"]:
            c["topics"][top] = {"firstIndex": seq, "conceptKeys": set(), "concepts": []}
            seq += 1
        return c["topics"][top]

    for row in rows:
        parent = (
            str(row.get("parentConcept") or row.get("Parent Concept") or "").strip()
            or "(Uncategorized)"
        )
        grade = str(row.get("Grade") or "").strip() or "(Unknown grade)"
        chapter = (
            str(row.get("chapterTitle") or row.get("Chapter Title") or "").strip()
            or "(Untitled chapter)"
        )
        topic_raw = str(row.get("Topic") or "").strip()
        topic = clean_trailing_code(topic_raw) or "(Untitled topic)"
        name = concept_label(row)
        if not name:
            continue
        desc = str(row.get("conceptDescription") or row.get("Concept Description") or "")
        concept = {
            "name": name,
            "description": desc,
            "meta": {
                "grade": grade,
                "chapter": chapter,
                "topic": topic,
                "parentConcept": parent,
            },
        }
        p = touch_parent(parent)
        g = touch_grade(p, grade)
        ch = touch_chapter(g, chapter)
        t = touch_topic(ch, topic)
        key = f"{name}\x00{desc}"
        if key in t["conceptKeys"]:
            continue
        t["conceptKeys"].add(key)
        t["concepts"].append(concept)

    out = []
    for pname, pdata in sorted(parents_m.items(), key=lambda x: x[1]["firstIndex"]):
        grades = []
        for gname, gdata in sorted(
            pdata["grades"].items(), key=lambda x: (grade_sort_key(x[0]), x[0])
        ):
            chapters = []
            for cname, cdata in sorted(
                gdata["chapters"].items(), key=lambda x: x[1]["firstIndex"]
            ):
                topics = []
                for tname, tdata in sorted(
                    cdata["topics"].items(), key=lambda x: x[1]["firstIndex"]
                ):
                    topics.append({"topic": tname, "concepts": tdata["concepts"]})
                chapters.append({"chapter": cname, "topics": topics})
            grades.append({"grade": gname, "chapters": chapters})
        out.append({"parentConcept": pname, "grades": grades})
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    flat_path = root / "public" / "data" / "concepts.json"
    rows = json.loads(flat_path.read_text(encoding="utf-8"))
    full = build(rows)
    sample = full[:1] if full else []
    # Keep fixture small for repo / docs (first parent → one grade → one chapter → two topics)
    if sample:
        p = sample[0]
        trimmed_grades = []
        for g in p["grades"][:1]:
            trimmed_chapters = []
            for ch in g["chapters"][:1]:
                ttrim = []
                for top in ch["topics"][:2]:
                    ttrim.append({**top, "concepts": top["concepts"][:3]})
                trimmed_chapters.append({**ch, "topics": ttrim})
            trimmed_grades.append({**g, "chapters": trimmed_chapters})
        sample = [{**p, "grades": trimmed_grades}]
    out_path = root / "public" / "data" / "hierarchy-sample.json"
    out_path.write_text(json.dumps(sample, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} ({len(sample)} parent concept(s))")


if __name__ == "__main__":
    main()
