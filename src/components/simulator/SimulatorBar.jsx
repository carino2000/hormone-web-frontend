import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipBack, Sparkles, Zap } from "lucide-react";
import { COLD_START_DAYS, useSimulationStore } from "../../state/simulationStore";
import { getDaySnapshot } from "../../data/simulationSource";
import { formatKoreanDate } from "../../lib/formatDate";

const SPEEDS = [1, 2, 4];

// 사이드 패널 전용 데모 컨트롤. App.jsx의 <aside>가 이미 라이트/다크에 맞는 배경을
// 깔아주므로, 여기서는 그 위에 얹히는 내용만 담당한다(자체 카드/그림자 불필요).
// 텍스트는 대부분 body의 상속 색상 + opacity로 처리해 다른 카드들과 같은 방식으로
// 테마를 따르고, 앰버 포인트(DEMO 배지·CTA·진행바)만 라이트/다크 공통으로 고정한다 —
// 이 패널이 "제품 화면이 아니라 데모 리모컨"이라는 정체성을 테마와 무관하게 유지하려는
// 의도적 선택.
export default function SimulatorBar() {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const totalDays = useSimulationStore((s) => s.totalDays);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const speed = useSimulationStore((s) => s.speed);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  const pause = useSimulationStore((s) => s.pause);
  const next = useSimulationStore((s) => s.next);
  const prev = useSimulationStore((s) => s.prev);
  const jumpTo = useSimulationStore((s) => s.jumpTo);
  const reset = useSimulationStore((s) => s.reset);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  // Day 20 진입 = 콜드스타트가 끝나고 예측이 처음 뜨는 데모의 하이라이트 순간.
  // 컨트롤 패널에서도 잠깐 축하 배지를 띄워 발표자가 "지금이에요"를 놓치지 않게 한다.
  // currentDay가 바뀐 "그 렌더"에서 바로 판단해야 하므로 렌더 중 상태 조정 패턴을 쓰고,
  // 일정 시간 뒤 꺼지는 타이머만 순수 side effect로 useEffect에 둔다.
  const [prevDayForReveal, setPrevDayForReveal] = useState(currentDay);
  const [revealPulse, setRevealPulse] = useState(false);
  if (currentDay !== prevDayForReveal) {
    setPrevDayForReveal(currentDay);
    if (currentDay === COLD_START_DAYS) setRevealPulse(true);
  }

  useEffect(() => {
    if (!revealPulse) return undefined;
    const t = setTimeout(() => setRevealPulse(false), 2600);
    return () => clearTimeout(t);
  }, [revealPulse]);

  const handleStepForward = () => {
    pause();
    next();
  };

  const tickPercent = ((COLD_START_DAYS - 1) / (totalDays - 1)) * 100;
  const progressPercent = ((currentDay - 1) / (totalDays - 1)) * 100;
  const atEnd = currentDay >= totalDays;
  const snapshot = getDaySnapshot(currentDay);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-wide text-neutral-900">
            <Sparkles className="h-3 w-3" />
            DEMO
          </span>
          <span className="text-[11px] font-medium opacity-60">시뮬레이션 · 하루 넘기기</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold">Day {currentDay}</span>
          <span className="text-xs font-medium opacity-50">
            {currentDay}/{totalDays}일
          </span>
        </div>
        <div className="mt-0.5 text-xs opacity-60">{formatKoreanDate(snapshot?.date)}</div>
      </div>

      <AnimatePresence>
        {revealPulse && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
          >
            베이스라인 {COLD_START_DAYS}일 수집 완료 — 첫 예측이 도착했어요.
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleStepForward}
        disabled={atEnd}
        whileTap={atEnd ? undefined : { scale: 0.97 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-neutral-900 shadow-lg shadow-amber-400/20 transition disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-neutral-400 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-white/30"
      >
        하루 넘기기 →
      </motion.button>

      <div className="flex items-center gap-2">
        <IconButton label="초기화" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </IconButton>

        <IconButton label="이전 날" onClick={prev} disabled={currentDay <= 1}>
          <SkipBack className="h-4 w-4" />
        </IconButton>

        <IconButton label={isPlaying ? "일시정지" : "자동 재생"} onClick={togglePlay} disabled={atEnd && !isPlaying}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </IconButton>

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`flex items-center gap-0.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                speed === s ? "bg-amber-400 text-neutral-900" : "opacity-50 hover:opacity-80"
              }`}
              aria-pressed={speed === s}
            >
              {s === 1 ? <Zap className="h-3 w-3" /> : null}
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* 스크러버 — 임의 일차로 점프. Day 20 지점에 콜드스타트 경계 눈금 표시 */}
      <div className="relative mt-1 px-1 pb-4">
        <div className="pointer-events-none absolute inset-x-1 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-amber-400/70" style={{ width: `${progressPercent}%` }} />
        </div>
        <span
          className="pointer-events-none absolute top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-indigo-400 dark:bg-sky-300"
          style={{ left: `${tickPercent}%` }}
          title={`Day ${COLD_START_DAYS} · 예측 시작`}
        />
        <input
          type="range"
          min={1}
          max={totalDays}
          step={1}
          value={currentDay}
          onPointerDown={pause}
          onChange={(e) => jumpTo(Number(e.target.value))}
          className="relative z-10 h-3 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-900 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-neutral-900 dark:[&::-webkit-slider-thumb]:bg-white dark:[&::-moz-range-thumb]:bg-white"
          aria-label="일차 스크러버"
        />
        {/* opacity가 아니라 색상 알파를 쓴다 — opacity는 부모의 합성 레이어 자체를
            흐리게 만들어서 자식(Day 20 라벨)이 아무리 진한 색을 줘도 40%를 못 넘는다. */}
        <div className="pointer-events-none absolute inset-x-1 -bottom-0.5 flex justify-between text-[10px] text-black/40 dark:text-white/40">
          <span>Day 1</span>
          <span className="absolute -translate-x-1/2 text-indigo-500 dark:text-sky-300" style={{ left: `${tickPercent}%` }}>
            Day {COLD_START_DAYS}
          </span>
          <span>Day {totalDays}</span>
        </div>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 text-neutral-700 transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}
