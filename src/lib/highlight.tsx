import { Fragment, type ReactNode } from "react";

/** Highlights all case-insensitive matches of query in text. */
export function HighlightLine({ text, query }: { text: string; query: string }): ReactNode {
  const q = query.trim();
  if (!q) return text;

  const parts: ReactNode[] = [];
  let remaining = text;
  let guard = 0;
  while (remaining && guard++ < 10_000) {
    const lower = remaining.toLowerCase();
    const qi = lower.indexOf(q.toLowerCase());
    if (qi < 0) {
      parts.push(remaining);
      break;
    }
    if (qi > 0) parts.push(remaining.slice(0, qi));
    parts.push(
      <mark
        key={parts.length}
        className="rounded bg-amber-200/90 px-0.5 text-slate-900 dark:bg-amber-400/40 dark:text-amber-50"
      >
        {remaining.slice(qi, qi + q.length)}
      </mark>,
    );
    remaining = remaining.slice(qi + q.length);
  }
  return <Fragment>{parts}</Fragment>;
}
