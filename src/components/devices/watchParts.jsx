// 워치 뷰 공용 컴포넌트. WATCH_UI_DESIGN_GUIDE.md §6 기준.
//
// 여러 화면이 같이 쓴다 — 복붙하지 말고 이걸 import 할 것.
// 색·상수는 lib/watchTokens.js 와 index.css 의 .watch-view 토큰에서 온다
// (컴포넌트에 hex 하드코딩 금지).

import { useState } from "react";

import { PHASE_KO, bandGradient, phaseColor } from "../../lib/watchTokens";

/** 면책 문구. ⓘ 에 올렸을 때만 뜬다 — 아래 WatchStatusBar 주석 참고. */
const DISCLAIMER = "의료 진단 아님 · 피임·임신 목적 사용 금지";

/**
 * 상태바 — 좌상단 ⓘ, 우상단 실제 시각.
 *
 * ★ 시뮬레이션 날짜가 아니라 <b>진짜 현재 시각</b>이다. 워치 상태바는 OS 영역이라
 *   앱 데이터가 올라오면 목업의 환상이 깨진다(가이드 §5).
 *
 * ★ <b>좌우 여백이 본문(20px)보다 넓다.</b> 스크린 라운드가 68px 이라 y=16 지점에서는
 *   x 가 24px 는 돼야 곡선 밖이다. 20px 로 두면 ⓘ 가 모서리 곡선에 물려서
 *   "프레임에 끼인" 것처럼 보인다 — 실제로 그렇게 보였다.
 *
 * ★ <b>면책 문구를 여기 ⓘ 에 접어 넣었다.</b> 예전엔 화면마다 하단에 상시 노출했는데,
 *   324px 폭에서 탭마다 각주가 깔리니 화면이 변명처럼 보였다. 이건 배포하는 서비스가
 *   아니라 발표에서 예측모델을 보여주는 껍데기라, 문구를 지우지는 않되 <b>필요할 때만</b>
 *   꺼내 보도록 바꿨다. 실제 서비스로 나가게 되면 상시 노출로 되돌려야 한다.
 *
 * ★ 툴팁은 <b>워치 스크린 안</b>에 그린다. 밖으로 나가면 목업의 환상이 깨진다(가이드 §11).
 */
export function WatchStatusBar() {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="relative z-20 flex h-[24px] w-full shrink-0 items-center justify-between px-[9px]">
      <button
        type="button"
        aria-label={DISCLAIMER}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[21px] w-[21px] items-center justify-center rounded-full text-[11px] font-bold leading-none"
        style={{ background: "rgba(255,255,255,.14)", color: "var(--w-text-mid)" }}
      >
        i
      </button>
      <span className="text-[13px] font-semibold" style={{ color: "var(--w-text)" }}>
        {time}
      </span>

      {open && (
        <div
          role="tooltip"
          className="absolute left-[9px] top-[26px] w-[240px] rounded-xl px-3 py-2 text-[10px] leading-relaxed"
          style={{
            background: "rgba(32,32,36,.97)",
            color: "var(--w-text-mid)",
            boxShadow: "0 8px 24px -6px rgba(0,0,0,.8)",
          }}
        >
          {DISCLAIMER}
          <br />
          <span style={{ color: "var(--w-text-dim)" }}>
            호르몬 수치는 측정값이 아니라 모델 추정값입니다.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 데이 스트립 — Apple 건강 앱의 가로 데이 스트립.
 *
 * ★ <b>지난 날 + 오늘만 그린다. 미래는 안 그린다.</b>
 *   가이드 원안은 오늘 기준 -3~+3 이지만, 이 데모는 하루씩 진행하는 구조라
 *   내일 이후의 예측이 <b>아직 존재하지 않는다</b>. 없는 걸 그리면 스포일러이거나
 *   거짓말이 된다. 그래서 과거로만 뻗는다.
 *
 * ★ <b>평일은 세로로 긴 라운드 사각, 오늘만 원</b>이다(가이드 §6 26×34 r13 / 44 r22).
 *   전부 원으로 두면 구슬을 늘어놓은 것처럼 보이고 "오늘"이 덜 튄다.
 *
 * ★ 날짜 숫자를 아래에 깐다. 색만 있으면 "무슨 날인지" 를 못 읽는데, 숫자가 있으면
 *   스트립이 달력으로 읽히고 화면의 빈 공간도 자연스럽게 채워진다.
 *
 * @param days  [{ date, status: 'predicted'|'collecting', phase }] — 과거→오늘 순
 */
export function WatchDayStrip({ days, size = "md", showDates = false }) {
  // lg 는 히어로(화면 1)용. 7칸 기준 6*28 + 48 + 6*6 = 252px 로 안쪽 폭 284px 에 들어간다.
  const w = size === "lg" ? 28 : 22;
  const h = size === "lg" ? 40 : 28;
  const today = size === "lg" ? 48 : 36;

  return (
    <div className="flex w-full items-end justify-center gap-[6px]">
      {days.map((d, i) => {
        const isToday = i === days.length - 1;
        // 수집만 한 날(콜드스타트)은 위상이 없다 — 빈 칸 색으로 둔다.
        const fill = d.status === "predicted" ? phaseColor(d.phase) : "var(--ph-empty)";
        const dayNum = Number(d.date.slice(-2));
        return (
          <div key={d.date} className="flex flex-col items-center">
            <div
              className="flex items-center justify-center"
              style={
                isToday
                  ? {
                      width: today + 12,
                      height: today + 14,
                      borderRadius: 20,
                      background: "rgba(255,255,255,.10)",
                    }
                  : { width: w, height: today + 14 }
              }
            >
              <div
                style={{
                  width: isToday ? today : w,
                  height: isToday ? today : h,
                  borderRadius: isToday ? today / 2 : 13,
                  background: fill,
                }}
              />
            </div>
            {showDates && (
              <span
                className="mt-1 text-[9px] font-semibold leading-none"
                style={{ color: isToday ? "var(--w-text)" : "var(--w-text-dim)" }}
              >
                {dayNum}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 위상 판정 밴드 — 이 프로젝트의 시그니처(가이드 §2).
 *
 * ★ 풀블리드다. 좌우 여백 0, border-radius 0. 각진 형태가 자사 앱과 맞물리는 지점이라
 *   둥글게 깎지 말 것.
 * ★ 텍스트는 검정이다. 4개 위상 그라디언트가 전부 밝은 톤이라 대비가 확보된다.
 * ★ 신뢰도는 `Reliability 0.97` 형식으로 고정 — `확신도 97%` 로 되돌리지 말 것.
 *   자사 앱 표기와 맞추는 지점이다.
 */
export function WatchVerdictBand({ phase, confidence, sub }) {
  return (
    <div
      className="w-full px-4 pb-2.5 pt-3"
      style={{ color: "var(--w-band-text)", background: bandGradient(phase) }}
    >
      <p className="text-[25px] font-extrabold leading-none tracking-[-0.02em]">
        {PHASE_KO[phase] ?? "—"}
      </p>
      {sub && <p className="mt-1 text-[12px] font-semibold opacity-[.78]">{sub}</p>}
      {/* confidence 가 null 이면 줄 자체를 접는다. 0.00 을 찍으면 "확신도 0" 이라는
          없는 정보를 만들어낸다(가이드 §8 결측 처리). */}
      {confidence != null && (
        <p className="mt-0.5 text-[10px] font-semibold opacity-[.58]">
          Reliability {confidence.toFixed(2)}
        </p>
      )}
    </div>
  );
}
