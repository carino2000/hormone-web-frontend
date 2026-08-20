export default function ContributionBars({ contributions }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium opacity-70">예측 근거 (신호 기여도)</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {contributions.map((c) => (
          <li key={c.label}>
            <div className="flex items-center justify-between text-xs">
              <span>{c.signal}</span>
              <span className="opacity-60">{Math.round(c.weight * 100)}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-neutral-100">
              <div
                className={`h-2 rounded-full ${c.direction === "up" ? "bg-rose-300" : "bg-indigo-300"}`}
                style={{ width: `${c.weight * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
