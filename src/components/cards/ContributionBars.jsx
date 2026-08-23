export default function ContributionBars({ contributions, fastForward = false }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <h3 className="text-sm font-medium opacity-70">예측 근거 (신호 기여도)</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {contributions.map((c) => (
          <li key={c.feature}>
            <div className="flex items-center justify-between text-xs">
              <span>{c.signal}</span>
              <span className="opacity-60">{Math.round(c.weight * 100)}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-neutral-100 dark:bg-white/10">
              <div
                className={`h-2 rounded-full ${fastForward ? "" : "transition-[width] duration-300 ease-out"} ${c.direction === "up" ? "bg-rose-300 dark:bg-amber-400" : "bg-indigo-300 dark:bg-sky-400"}`}
                style={{ width: `${c.weight * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
