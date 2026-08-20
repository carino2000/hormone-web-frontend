import { PHASE_COLOR_CLASS } from "../../lib/phase";

export default function PredictionSummaryCard({ summary, compact = false }) {
  const { phase, phase_label_ko, confidence, days_to_ovulation, summary_text } = summary;

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <span className={`h-2 w-2 rounded-full ${PHASE_COLOR_CLASS[phase]}`} />
        <p className="text-[11px] font-medium">{phase_label_ko}</p>
        <p className="text-lg font-semibold">D-{days_to_ovulation}</p>
        <p className="text-[10px] opacity-70">확신도 {Math.round(confidence * 100)}%</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${PHASE_COLOR_CLASS[phase]}`} />
        <span className="text-sm font-medium opacity-70">{phase_label_ko}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold">배란까지 D-{days_to_ovulation}</p>
      <p className="mt-1 text-sm opacity-60">예측 확신도 {Math.round(confidence * 100)}%</p>
      <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm leading-relaxed">{summary_text}</p>
    </div>
  );
}
