import { VITALS_LABEL_KO } from "../../api";
import { useCountUp } from "../../lib/useCountUp";
import { useChangeFlash } from "../../lib/useChangeFlash";

const DECIMALS = {
  rmssd: 1,
  nightly_temperature: 2,
  resting_heart_rate: 1,
  overall_score: 0,
  glucose_mean: 1,
  steps: 0,
};

export default function VitalsSummary({ vitals, fastForward = false }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <h3 className="text-sm font-medium opacity-70">오늘의 생체신호</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Object.entries(vitals).map(([key, v]) => (
          <VitalTile key={key} label={VITALS_LABEL_KO[key] ?? key} vital={v} decimals={DECIMALS[key] ?? 0} fastForward={fastForward} />
        ))}
      </div>
    </div>
  );
}

function VitalTile({ label, vital, decimals, fastForward }) {
  const { value, baseline, unit } = vital;
  const measured = value != null;
  const displayValue = useCountUp(measured ? value : baseline, { decimals, disabled: fastForward || !measured });
  const justChanged = useChangeFlash(value, { disabled: fastForward });
  const diff = measured && baseline != null ? value - baseline : null;

  return (
    <div
      className={`rounded-xl p-3 transition-colors duration-300 ${
        justChanged ? "bg-rose-50 dark:bg-amber-400/10" : "bg-neutral-50 dark:bg-white/5"
      }`}
    >
      <p className="text-xs opacity-60">{label}</p>
      {measured ? (
        <p className="text-lg font-semibold">
          {displayValue}
          <span className="text-xs font-normal opacity-60"> {unit}</span>
        </p>
      ) : (
        <p className="text-lg font-semibold opacity-40">측정 안 됨</p>
      )}
      <p
        className={`text-[11px] ${
          diff == null
            ? "opacity-0"
            : diff >= 0
              ? "text-rose-400 dark:text-amber-400"
              : "text-indigo-400 dark:text-sky-400"
        }`}
      >
        {diff == null ? "—" : `평소 대비 ${diff >= 0 ? "+" : ""}${diff.toFixed(decimals)}`}
      </p>
    </div>
  );
}
