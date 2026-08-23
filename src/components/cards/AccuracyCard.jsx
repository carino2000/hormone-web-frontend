import { Check, X } from "lucide-react";

/**
 * 그날의 예측 vs 실측 (P-01).
 *
 * 이 카드가 데모의 성격을 바꾼다. 이게 없으면 대표는 "앱 잘 만들었네"라고 생각하고,
 * 있으면 "모델이 맞히는구나"라고 생각한다.
 *
 * 실측값은 Mira 기기로 측정한 mcPHASES 원본이며 모델 입력에 포함되지 않았다.
 */
export default function AccuracyCard({ accuracy }) {
  if (!accuracy) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium opacity-70">오늘의 예측 vs 실측</h3>
        <span className="text-[10px] opacity-50">실측 = mcPHASES 원본</span>
      </div>

      {/* 주기 단계 적중 여부 */}
      <div
        className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
          accuracy.phaseMatched
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
            : "bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
        }`}
      >
        {accuracy.phaseMatched ? (
          <Check className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <X className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>
          주기 단계 <strong>{accuracy.phasePredicted}</strong>
          {accuracy.phaseMatched ? (
            <> — 실측과 일치</>
          ) : (
            <>
              {" "}
              — 실측은 <strong>{accuracy.phaseActual}</strong>
            </>
          )}
        </span>
      </div>

      {/* 호르몬 3종 */}
      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="text-left opacity-50">
            <th className="pb-1 font-medium">호르몬</th>
            <th className="pb-1 text-right font-medium">예측</th>
            <th className="pb-1 text-right font-medium">실측</th>
            <th className="pb-1 text-right font-medium">오차</th>
          </tr>
        </thead>
        <tbody>
          {accuracy.hormones.map((h) => (
            <tr key={h.key} className="border-t border-black/5 dark:border-white/5">
              <td className="py-1.5">{h.label}</td>
              <td className="py-1.5 text-right font-medium tabular-nums">{fmt(h.predicted)}</td>
              <td className="py-1.5 text-right tabular-nums opacity-60">{fmt(h.actual)}</td>
              <td className={`py-1.5 text-right tabular-nums ${errorTone(h.errorPct)}`}>
                {h.errorPct == null ? "—" : `${h.errorPct > 0 ? "+" : ""}${h.errorPct.toFixed(1)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(v) {
  // 결측은 0이 아니라 대시로 — 측정 자체가 없었다는 뜻이다
  if (v == null) return "—";
  return Number(v).toFixed(1);
}

// 오차 크기에 따라 색을 다르게. 절대적 기준이 아니라 읽기 편하라고 두는 것이다.
function errorTone(errorPct) {
  if (errorPct == null) return "opacity-40";
  const abs = Math.abs(errorPct);
  if (abs <= 10) return "text-emerald-600 dark:text-emerald-400";
  if (abs <= 25) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}
