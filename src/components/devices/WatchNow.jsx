import { useEffect, useState } from "react";
import { getCalendar } from "../../api";
import { useSimulationStore } from "../../state/simulationStore";
import { PHASE_KO, phaseColor } from "../../lib/watchTokens";
import { WatchDayStrip, WatchStatusBar, WatchVerdictBand } from "./watchParts";

const STRIP_DAYS = 7;

/**
 * 워치 화면 1 — "지금" (히어로). WATCH_UI_DESIGN_GUIDE.md §6 화면 1.
 *
 * <b>손목은 판정을 보는 곳이다. 곡선은 폰에 있다.</b>
 * 이 화면은 질문 하나에만 답한다 — <b>지금 사이클 어디인가</b>.
 * 그래서 지표를 더 얹지 않는다. 호르몬 수치는 다음 화면(예측 상세)에 있다.
 *
 * ★ 예전에는 이 화면과 "주기 흐름"(달력 탭) 화면이 <b>거의 같았다</b> — 둘 다
 *   스트립 + 오늘 단계였다. 위상 범례를 이쪽으로 흡수해 하나로 합치고,
 *   달력 탭은 월 격자로 바꿔 역할을 갈랐다.
 */
export default function WatchNow({ summary, coldStart, pending, predictionError }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);
  const dataRevision = useSimulationStore((s) => s.dataRevision);
  const isPredicting = useSimulationStore((s) => s.isPredicting);
  const [strip, setStrip] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getCalendar(currentDay).then((cal) => {
      if (cancelled) return;
      // 과거 + 오늘만. 미래 예측은 아직 존재하지 않는다(watchParts 주석 참고).
      const past = cal.days.filter((d) => d.status !== "future");
      setStrip(past.slice(-STRIP_DAYS));
    });
    return () => {
      cancelled = true;
    };
  }, [currentDay, dataRevision]);

  const dateLabel = summary?.date
    ? (() => {
        const [, m, d] = summary.date.split("-").map(Number);
        return `${m}월 ${d}일`;
      })()
    : null;

  return (
    <div className="flex h-full flex-col px-5 pt-4">
      <WatchStatusBar />

      {/* ★ 캡션·스트립·밴드·면책을 <b>한 덩어리로 묶어 세로 중앙</b>에 놓는다.
          각 조각을 위/아래로 흩어 놓으면 그 사이가 전부 검은 구멍이 되는데, 워치는
          화면이 작아서 그 구멍이 "덜 만든 화면"으로 읽힌다. 묶어서 가운데 두면
          남는 여백이 위아래로 나뉘어 여백처럼 보인다.
          밴드가 화면 중앙을 가로지르는 것도 자사 앱 레이아웃과 같은 모양이다. */}
      <div className="flex flex-1 flex-col justify-center">
      {/* 날짜 캡션. 한글이 섞여 있어 자간을 벌리지 않는다(가이드 §4) */}
      <p
        className="mt-2.5 text-center text-[10px] font-bold"
        style={{ color: "var(--w-text-dim)" }}
      >
        {currentDay < 1 ? "수집 시작 전" : `DAY ${currentDay}${dateLabel ? ` · ${dateLabel}` : ""}`}
      </p>

      {/* ★ 스트립을 남는 공간의 <b>가운데</b>에 둔다.
          예전엔 스트립을 위에 붙이고 스페이서로 밴드를 바닥까지 밀었는데, 그 사이에
          200px 짜리 검은 구멍이 생겨서 화면이 비어 보였다. 지금은 위아래가 같이 눌린다. */}
      <div className="mt-4 mb-4 flex items-center justify-center">
        {strip.length > 0 ? (
          <WatchDayStrip days={strip} size="lg" showDates />
        ) : (
          <p className="text-[12px]" style={{ color: "var(--w-text-dim)" }}>
            하루를 넘기면 기록이 쌓입니다
          </p>
        )}
      </div>

      {/* 판정 밴드는 풀블리드다 — 부모의 px-5 를 음수 마진으로 되돌려 화면 폭을 채운다.
          ★ 둥글게 깎지 말 것. 각진 형태가 이 디자인의 핵심이다.
          ★ 면책 문구는 상단 ⓘ 로 옮겼다(watchParts.WatchStatusBar 주석 참고). */}
      <div className="-mx-5">
        {coldStart ? (
          <ColdBand day={currentDay} total={coldStartDays} />
        ) : (
          <WatchVerdictBand
            phase={summary?.phase}
            confidence={summary?.confidence ?? null}
            sub={
              isPredicting || pending
                ? `Day ${summary?.predictionDay} 기준 · 계산 중`
                : null
            }
          />
        )}

        {/* 실패는 실패로 말한다. 계산 중으로 두면 발표자가 기다리기만 한다. */}
        {predictionError && (
          <p
            className="px-5 pt-1.5 text-center text-[10px] font-semibold"
            style={{ color: "var(--ph-menstrual)" }}
          >
            예측 실패 · {predictionError}
          </p>
        )}

        {/* 색이 무슨 뜻인지는 여기 한 곳에서만 푼다. 스트립은 여러 화면에 나오지만
            범례가 화면마다 반복되면 좁은 워치에서 잡음이 된다. */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-3 pt-2">
          {["Menstrual", "Follicular", "Fertility", "Luteal"].map((p) => (
            <span key={p} className="flex items-center gap-1">
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: phaseColor(p) }}
              />
              <span className="text-[9px]" style={{ color: "var(--w-text-mid)" }}>
                {PHASE_KO[p]}
              </span>
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

/**
 * 콜드스타트용 밴드. 아직 판정할 게 없으니 위상 색 대신 중립 회색을 쓰고,
 * 대신 <b>얼마나 모였는지</b>를 채움 막대로 보여준다 — 숫자만 쓰면 워치에서 안 읽힌다.
 */
function ColdBand({ day, total }) {
  const pct = Math.min(100, Math.round((day / Math.max(1, total)) * 100));
  return (
    <div className="px-5 pb-2.5 pt-3" style={{ background: "var(--w-row)" }}>
      <p className="text-[17px] font-extrabold leading-none" style={{ color: "var(--w-text)" }}>
        데이터 수집 중
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--w-ring-track)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: "var(--w-amber)" }}
        />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold" style={{ color: "var(--w-text-mid)" }}>
        {day} / {total}일
      </p>
    </div>
  );
}
