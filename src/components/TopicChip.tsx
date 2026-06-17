const TONE: Record<string, string> = {
  business: "bg-amber-50 text-amber-800 border-amber-200",
  tech: "bg-sky-50 text-sky-800 border-sky-200",
  language: "bg-emerald-50 text-emerald-800 border-emerald-200",
  "soft-skill": "bg-rose-50 text-rose-800 border-rose-200",
  "general-knowledge": "bg-slate-100 text-slate-700 border-slate-200",
  history: "bg-orange-50 text-orange-800 border-orange-200",
  science: "bg-indigo-50 text-indigo-800 border-indigo-200",
  creativity: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
};

export function TopicChip({ topic }: { topic: string }) {
  const tone = TONE[topic] ?? "bg-violet-50 text-violet-800 border-violet-200";
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${tone}`}>{topic}</span>;
}
