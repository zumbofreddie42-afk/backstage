"use client";

import { useMemo, useState } from "react";

export type LibraryItem = { id: string; title: string; description: string; url: string; ageBand: string; level: string; topic: string };

type Labels = { filterAge: string; filterLevel: string; filterTopic: string; all: string; empty: string; open: string };

/** Client-side filters over the published resources (age, level, topic). */
export function ResourceLibrary({ items, labels, ageLabels }: { items: LibraryItem[]; labels: Labels; ageLabels: Record<string, string> }) {
  const [age, setAge] = useState("");
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const levels = useMemo(() => [...new Set(items.map((i) => i.level).filter(Boolean))].sort(), [items]);
  const topics = useMemo(() => [...new Set(items.map((i) => i.topic).filter(Boolean))].sort(), [items]);
  const shown = items.filter(
    (i) => (!age || i.ageBand === age || i.ageBand === "all") && (!level || i.level === level) && (!topic || i.topic === topic),
  );

  const select = (id: string, label: string, value: string, set: (v: string) => void, options: { value: string; label: string }[]) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => set(e.target.value)} className="field mt-1">
        <option value="">{labels.all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <div className="grid gap-4 rounded-2xl bg-muted p-4 sm:grid-cols-3">
        {select("f-age", labels.filterAge, age, setAge, ["young", "middle", "high", "adults"].map((v) => ({ value: v, label: ageLabels[v] ?? v })))}
        {select("f-level", labels.filterLevel, level, setLevel, levels.map((v) => ({ value: v, label: v })))}
        {select("f-topic", labels.filterTopic, topic, setTopic, topics.map((v) => ({ value: v, label: v })))}
      </div>
      <p className="sr-only" aria-live="polite">
        {shown.length}
      </p>
      {shown.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id} className="flex flex-col rounded-2xl border border-border p-5">
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {r.ageBand !== "all" && <span className="rounded-full bg-lavender px-2.5 py-0.5 text-primary">{ageLabels[r.ageBand]}</span>}
                {r.level && <span className="rounded-full bg-magenta-soft px-2.5 py-0.5 text-magenta-strong">{r.level}</span>}
                {r.topic && <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{r.topic}</span>}
              </div>
              <h3 className="mt-3 text-lg font-extrabold text-ink">{r.title}</h3>
              {r.description && <p className="mt-1 flex-1 text-muted-foreground">{r.description}</p>}
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 font-semibold text-primary underline underline-offset-4">
                {labels.open} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
