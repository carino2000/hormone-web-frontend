import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Pause, Play, RotateCcw, Sparkles, Zap } from "lucide-react";
import { useSimulationStore } from "../../state/simulationStore";
import { getDaySnapshot } from "../../data/simulationSource";
import { formatKoreanDate } from "../../lib/formatDate";

const WS_DOT = {
  connected: { color: "bg-emerald-400", label: "실시간 연결됨" },
  connecting: { color: "bg-amber-400", label: "연결 중" },
  disconnected: { color: "bg-rose-400", label: "연결 끊김" },
};

const SPEEDS = [1, 2, 4];

// 사이드 패널 전용 데모 컨트롤. App.jsx의 <aside>가 이미 라이트/다크에 맞는 배경을
// 깔아주므로, 여기서는 그 위에 얹히는 내용만 담당한다(자체 카드/그림자 불필요).
// 앰버 포인트(DEMO 배지·CTA·진행바)만 라이트/다크 공통으로 고정한다 — 이 패널이
// "제품 화면이 아니라 데모 리모컨"이라는 정체성을 테마와 무관하게 유지하려는 의도.
//
// ★ 데이터 소스 토글이 없다. 백엔드가 유일한 진실이라 고를 게 없다.
//   (로컬 목업은 제거했다 — data/simulationSource.js 주석 참고)
export default function SimulatorBar() {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const totalDays = useSimulationStore((s) => s.totalDays);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const speed = useSimulationStore((s) => s.speed);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  const pause = useSimulationStore((s) => s.pause);
  const next = useSimulationStore((s) => s.next);
  const reset = useSimulationStore((s) => s.reset);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  const wsStatus = useSimulationStore((s) => s.wsStatus);
  const isAdvancing = useSimulationStore((s) => s.isAdvancing);
  const loadError = useSimulationStore((s) => s.loadError);
  const init = useSimulationStore((s) => s.init);

  // 콜드스타트가 끝나고 예측이 처음 뜨는 데모의 하이라이트 순간.
  // 컨트롤 패널에서도 잠깐 배지를 띄워 발표자가 "지금이에요"를 놓치지 않게 한다.
  // currentDay가 바뀐 "그 렌더"에서 바로 판단해야 하므로 렌더 중 상태 조정 패턴을 쓰고,
  // 일정 시간 뒤 꺼지는 타이머만 순수 side effect로 useEffect에 둔다.
  const [prevDayForReveal, setPrevDayForReveal] = useState(currentDay);
  const [revealPulse, setRevealPulse] = useState(false);
  if (currentDay !== prevDayForReveal) {
    setPrevDayForReveal(currentDay);
    if (currentDay === coldStartDays) setRevealPulse(true);
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

  // 스크러버는 0..totalDays 범위이므로 분모도 totalDays 다.
  const tickPercent = (coldStartDays / Math.max(1, totalDays)) * 100;
  const progressPercent = (currentDay / Math.max(1, totalDays)) * 100;
  const atEnd = currentDay >= totalDays;
  const snapshot = getDaySnapshot(currentDay);
  const dot = WS_DOT[wsStatus] ?? WS_DOT.disconnected;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-wide text-neutral-900">
            <Sparkles className="h-3 w-3" />
            DEMO
          </span>
          <span className="text-[11px] font-medium opacity-60">시뮬레이션 · 하루 넘기기</span>
          <span className="ml-auto flex items-center gap-1" title={dot.label}>
            <span className={`h-2 w-2 rounded-full ${dot.color}`} />
            <span className="text-[10px] opacity-50">{dot.label}</span>
          </span>
        </div>
      </div>

      {/* 백엔드에 못 붙었을 때. 목업 폴백이 없으므로 숨기지 않고 그대로 보여준다. */}
      {loadError && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            백엔드에 연결할 수 없습니다
          </p>
          <p className="mt-0.5 opacity-70">{loadError}</p>
          <p className="mt-1 opacity-70">
            <code className="rounded bg-black/5 px-1 dark:bg-white/10">./gradlew bootRun</code> 으로 백엔드를 켜세요.
          </p>
          <button
            type="button"
            onClick={init}
            className="mt-1.5 rounded-md bg-rose-600/10 px-2 py-1 font-medium hover:bg-rose-600/20"
          >
            다시 시도
          </button>
        </div>
      )}

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">Day {currentDay}</span>
          <span className="text-xs font-medium opacity-50">
            {currentDay}/{totalDays}일
          </span>
        </div>
        {/* Day 0 은 대응하는 날짜가 없다. 시드 첫날이 Day 1 이기 때문. */}
        <div className="mt-0.5 text-xs opacity-60">
          {currentDay < 1 ? "수집 시작 전" : formatKoreanDate(snapshot?.date)}
        </div>
      </div>

      <AnimatePresence>
        {revealPulse && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
          >
            베이스라인 {coldStartDays}일 수집 완료 — 첫 예측이 도착했어요.
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleStepForward}
        disabled={atEnd || isAdvancing || !!loadError}
        whileTap={atEnd || isAdvancing ? undefined : { scale: 0.97 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-neutral-900 shadow-lg shadow-amber-400/20 transition disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-neutral-400 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-white/30"
      >
        {isAdvancing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            처리 중...
          </>
        ) : atEnd ? (
          "마지막 날"
        ) : (
          `Day ${currentDay + 1} 정보 보내기 →`
        )}
      </motion.button>

      <div className="flex items-center gap-2">
        <IconButton label="초기화" onClick={reset} disabled={isAdvancing}>
          <RotateCcw className="h-4 w-4" />
        </IconButton>

        <IconButton
          label={isPlaying ? "일시정지" : "자동 재생"}
          onClick={togglePlay}
          disabled={(atEnd && !isPlaying) || !!loadError}
        >
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

      {/* 진행 표시 — 읽기 전용이다.
          백엔드가 진실이라 임의 일차로 점프할 수 없다(이미 보낸 데이터를 되돌리려면 초기화뿐).
          되는 척하는 슬라이더를 두면 화면과 DB 가 어긋난다.

          ★ 좌표계 주의: 눈금과 진행바는 같은 레이어(inset-x-0) 안에서 % 로 계산한다. */}
      <div className="relative mb-5 mt-6">
        <div className="pointer-events-none absolute inset-x-0 inset-y-0">
          {/* "예측 시작" 라벨은 트랙 위에 둔다. 90일 기준 21% 지점이라
              아래에 두면 "Day 0" 라벨과 겹칠 수 있다. */}
          <span
            className="absolute -top-5 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-indigo-500 dark:text-sky-300"
            style={{ left: `${tickPercent}%` }}
          >
            예측 시작
          </span>

          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-amber-400/70"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>

          <span
            className="absolute top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-indigo-400 dark:bg-sky-300"
            style={{ left: `${tickPercent}%` }}
            title={`Day ${coldStartDays} · 예측 시작`}
          />

          {/* opacity가 아니라 색상 알파를 쓴다 — opacity는 부모의 합성 레이어 자체를
              흐리게 만들어서 자식이 아무리 진한 색을 줘도 못 넘는다. */}
          <span className="absolute -bottom-5 left-0 text-[10px] text-black/40 dark:text-white/40">Day 0</span>
          <span className="absolute -bottom-5 right-0 text-[10px] text-black/40 dark:text-white/40">
            Day {totalDays}
          </span>
        </div>
        <div className="h-4" />
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
