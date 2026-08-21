import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useCountUp } from "../../lib/useCountUp";

const MINI_LABELS = {
  rmssd: { label: "HRV", unit: "ms" },
  nightly_temperature: { label: "야간 피부온도", unit: "°C" },
  steps: { label: "활동량", unit: "보" },
};

// Day 1~19(콜드스타트) 동안 홈/예측상세 화면에 노출되는 카드.
// 아직 예측은 없지만 "데이터는 이미 쌓이고 있다"는 걸 보여줘야 Day 20의 첫 예측 등장이
// 극적으로 느껴진다 — 아무것도 없다가 갑자기 나타나면 그냥 로딩처럼 보인다.
export default function ColdStartCard({ day, coldStartDays, wearable, compact = false, fastForward = false }) {
  const progress = useCountUp((day / coldStartDays) * 100, { disabled: fastForward });
  const remaining = Math.max(0, coldStartDays - day);

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <Activity className="h-4 w-4 opacity-60" />
        <p className="text-[11px] font-medium opacity-70">데이터 수집 중</p>
        <p className="text-lg font-semibold">
          {day}/{coldStartDays}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
        </span>
        <span className="text-sm font-medium opacity-70">데이터 수집 중</span>
      </div>

      <p className="mt-2 text-3xl font-semibold">
        {day}<span className="text-lg opacity-50">/{coldStartDays}일</span>
      </p>
      <p className="mt-1 text-sm opacity-60">
        {remaining > 0 ? `예측까지 ${remaining}일 남았어요` : "곧 첫 예측이 도착해요"}
      </p>

      <div className="mt-3 h-2 w-full rounded-full bg-neutral-100 dark:bg-white/10">
        <motion.div
          className="h-2 rounded-full bg-sky-400"
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: fastForward ? 0 : 0.25, ease: "easeOut" }}
        />
      </div>

      <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm leading-relaxed dark:bg-white/5">
        예측 모델이 안정적으로 작동하려면 최소 {coldStartDays}일치 웨어러블 신호가 필요해요.
        그동안 수집된 신호는 이미 쌓이고 있어요.
      </p>

      {wearable && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Object.entries(MINI_LABELS).map(([key, meta]) => {
            const value = wearable[key];
            return (
              <div key={key} className="rounded-xl bg-neutral-50 p-2.5 text-center dark:bg-white/5">
                <p className="text-[10px] opacity-60">{meta.label}</p>
                <p className="mt-0.5 text-sm font-semibold">
                  {value == null ? "측정 안 됨" : `${value}${meta.unit}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
