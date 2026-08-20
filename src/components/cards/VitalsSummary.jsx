const LABELS = {
  rmssd: "HRV",
  nightly_temp: "야간 피부온도",
  resting_hr: "안정시 심박",
  sleep_score: "수면 점수",
  glucose_mean: "평균 혈당",
};

export default function VitalsSummary({ vitals }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <h3 className="text-sm font-medium opacity-70">오늘의 생체신호</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Object.entries(vitals).map(([key, v]) => {
          const diff = v.value - v.baseline;
          return (
            <div key={key} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <p className="text-xs opacity-60">{LABELS[key]}</p>
              <p className="text-lg font-semibold">
                {v.value}
                <span className="text-xs font-normal opacity-60"> {v.unit}</span>
              </p>
              <p
                className={`text-[11px] ${diff >= 0 ? "text-rose-400 dark:text-amber-400" : "text-indigo-400 dark:text-sky-400"}`}
              >
                평소 대비 {diff >= 0 ? "+" : ""}
                {diff.toFixed(1)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
