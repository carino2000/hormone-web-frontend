import { motion } from "framer-motion";
import { PHASE_COLOR_CLASS } from "../../lib/phase";
import { useCountUp } from "../../lib/useCountUp";
import { useChangeFlash } from "../../lib/useChangeFlash";

/**
 * 오늘의 예측 요약.
 *
 * ★ 예전에는 제일 큰 글씨가 `다음 월경 예상 D-7` 이었다. 모델이 오늘자 phase 만
 *   준다고 해서 다음 월경 예측 기능을 합의 하에 뺐고, 그 자리를 **주기 단계**가 대신한다.
 *   단계가 이제 모델의 핵심 출력이라 가장 크게 보여주는 게 맞다.
 *
 * ★ confidence 가 없으면 확신도 줄을 통째로 숨긴다. 모델이 안 주면 만들어낼 수 없고,
 *   그럴듯한 숫자를 지어내면 그건 거짓말이다.
 */
export default function PredictionSummaryCard({ summary, compact = false, fastForward = false }) {
  const { phase, phase_label_ko, confidence, summary_text } = summary;

  const hasConfidence = confidence != null;
  const confidencePct = useCountUp(hasConfidence ? Math.round(confidence * 100) : 0, {
    disabled: fastForward || !hasConfidence,
  });
  // phase는 하루 만에 자주 안 바뀐다 — 바뀌는 날에는 조용히 넘어가지 않고 카드 전체를
  // 한 번 크게 펄스시켜 "단계가 전환됐다"를 눈에 띄게 알린다.
  const phaseJustChanged = useChangeFlash(phase, { duration: 1400, disabled: fastForward });

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <span className={`h-2 w-2 rounded-full ${PHASE_COLOR_CLASS[phase]}`} />
        <p className="text-base font-semibold leading-tight">{phase_label_ko}</p>
        {hasConfidence && <p className="text-[10px] opacity-70">확신도 {confidencePct}%</p>}
      </div>
    );
  }

  return (
    <motion.div
      animate={phaseJustChanged ? { scale: [1, 1.02, 1] } : undefined}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border bg-white p-6 shadow-sm transition-colors dark:bg-slate-900 ${
        phaseJustChanged
          ? "border-rose-300 shadow-rose-100 dark:border-amber-400/60 dark:shadow-amber-400/10"
          : "border-black/5 dark:border-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${PHASE_COLOR_CLASS[phase]}`} />
          <span className="text-sm font-medium opacity-70">오늘의 주기 단계</span>
        </div>
        {phaseJustChanged && (
          <motion.span
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-400 dark:bg-amber-400/10 dark:text-amber-400"
          >
            단계 전환
          </motion.span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold">{phase_label_ko}</p>
      {hasConfidence && <p className="mt-1 text-sm opacity-60">예측 확신도 {confidencePct}%</p>}
      <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm leading-relaxed dark:bg-white/5">{summary_text}</p>
    </motion.div>
  );
}
