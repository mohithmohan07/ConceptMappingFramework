# Data pipeline: Excel → JSON → React

## Column mapping (source → UI)

| Excel column | JSON field (export script) | Used in app as |
|--------------|---------------------------|-----------------|
| Parent Concept | `parentConcept` | Top hierarchy node |
| Grade | `Grade` | Grade level (string) |
| Chapter Title | `chapterTitle` | Chapter name |
| Topic | `Topic` | Topic label after removing trailing ` (CODE)` |
| Display Name | `displayName` | Visible concept title |
| Concept | `Concept` | Fallback title only if Display Name is empty |
| Concept Description | `conceptDescription` | Modal body (verbatim; optional parse) |

Columns present in the file but **not shown** in the sales UI: Board, Book, Subject, Chapter No, Chapter Code, Concept ID, MMD Path, PDF Path.

## Step 1 — Export Excel to `public/data/concepts.json`

From the `concept-mapping-viz` folder (with Python 3 + pandas + openpyxl):

```powershell
python scripts/excel_to_json.py "C:\path\to\your\Concepts.xlsx" "public\data\concepts.json"
```

The script reads all columns and writes UTF-8 JSON. Missing cells become JSON `null`.

## Step 2 — (Optional) Regenerate the small hierarchy fixture

```powershell
python scripts/export_hierarchy_sample.py
```

This reads `public/data/concepts.json` and writes `public/data/hierarchy-sample.json` (trimmed for documentation).

## Step 3 — Run the app

```powershell
npm install
npm run dev
```

The app loads **`/data/concepts.json`** at runtime. Replace that file after re-exporting from Excel; refresh the browser to pick up changes.

## CSV / alternate sources

To use CSV instead of Excel, convert CSV to the same JSON row shape (keys matching the table above), or extend `scripts/excel_to_json.py` to read `read_csv` and emit the same structure.
