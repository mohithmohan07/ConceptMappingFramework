import type { ParsedDescription } from "../data/types";

/**
 * Splits rich concept text into optional blocks when headings are present.
 * Falls back to raw-only when structure is not detected.
 */
export function parseConceptDescription(text: string): ParsedDescription {
  const raw = text ?? "";
  if (!raw.trim()) {
    return { raw };
  }

  const typesIdx = raw.search(/\n\s*Types\s*:/i);
  const miscIdx = raw.search(/\n\s*Misconception\s*:/i);

  let main = raw;
  let types: string | undefined;
  let misconception: string | undefined;

  const cutTypes = typesIdx >= 0;
  const cutMisc = miscIdx >= 0;

  if (cutTypes && cutMisc) {
    const first = Math.min(typesIdx, miscIdx);
    const second = Math.max(typesIdx, miscIdx);
    main = raw.slice(0, first).trim();
    const mid = raw.slice(first, second).trim();
    const tail = raw.slice(second).trim();
    if (typesIdx < miscIdx) {
      types = stripHeading(mid, "Types");
      misconception = stripHeading(tail, "Misconception");
    } else {
      misconception = stripHeading(mid, "Misconception");
      types = stripHeading(tail, "Types");
    }
  } else if (cutTypes) {
    main = raw.slice(0, typesIdx).trim();
    types = stripHeading(raw.slice(typesIdx).trim(), "Types");
  } else if (cutMisc) {
    main = raw.slice(0, miscIdx).trim();
    misconception = stripHeading(raw.slice(miscIdx).trim(), "Misconception");
  }

  const parsedDescription = stripHeading(main, "Description");

  const parsed: ParsedDescription = { raw };

  if (parsedDescription) {
    parsed.description = parsedDescription;
  }

  if (types) {
    parsed.types = types;
  }

  if (misconception) {
    parsed.misconception = misconception;
  }

  return parsed;
}

function stripHeading(block: string, label: string): string {
  const re = new RegExp(`^\\s*${label}\\s*:`, "i");
  return block.replace(re, "").trim();
}
