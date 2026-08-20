import { PHASE_COLOR_CLASS, PHASE_LABELS_KO } from "../../lib/phase";

export default function PhaseLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-neutral-500 dark:text-slate-400">
      {Object.entries(PHASE_LABELS_KO).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${PHASE_COLOR_CLASS[key]}`} />
          {label}
        </div>
      ))}
    </div>
  );
}
