// 워치 화면 2~6. WATCH_UI_DESIGN_GUIDE.md §6 기준.
//
// 화면 1(판정)은 WatchNow.jsx 에 따로 있다 — 히어로라 분량이 달라서다.
//
// ★ 공통 원칙: 화면 하나에 질문 하나. 워치는 좁아서 두 가지를 물으면 둘 다 안 읽힌다.
// ★ null 을 0 으로 렌더하지 않는다. EMPTY(—) 로 둔다.

import { EMPTY, phaseColor } from "../../lib/watchTokens";
import { WatchStatusBar } from "./watchParts";

/** 화면 상단 제목 + 구분선. 5개 화면이 같은 모양을 쓴다. */
function WatchHeader({ title, right }) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <p className="text-[16px] font-bold tracking-[-0.01em]">{title}</p>
        {right && (
          <span
            className="text-[10px] font-bold"
            style={{ color: "var(--w-text-dim)" }}
          >
            {right}
          </span>
        )}
      </div>
      <div
        className="mt-2 h-px w-full"
        style={{ background: "var(--w-line)" }}
      />
    </>
  );
}

/** 데이터가 아직 없을 때. ★ 빈 검정 화면이나 스켈레톤으로 두지 않는다(가이드 §8). */
function WatchEmpty({ children }) {
  return (
    <div className="flex flex-1 items-center justify-center px-2 text-center">
      <p
        className="text-[12px] leading-relaxed"
        style={{ color: "var(--w-text-dim)" }}
      >
        {children}
      </p>
    </div>
  );
}

function Shell({ title, right, children }) {
  return (
    <div className="flex h-full flex-col px-5 pt-3.5">
      <WatchStatusBar />
      <div className="mt-1.5">
        <WatchHeader title={title} right={right} />
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 화면 2 — 호르몬 (자사 앱 결과 리스트 구조)
// ---------------------------------------------------------------------------

const HORMONE_TOKEN = { lh: "--h-lh", estrogen: "--h-e2", pdg: "--h-pdg" };

/**
 * 오늘의 호르몬 3종.
 *
 * ★ 자사 앱의 `Testosterone  6.54 ng/mL` 행 구조를 그대로 쓴다 —
 *   좌측에 색 도트 + 라벨, 우측에 값 + 단위.
 * ★ 스파크라인을 넣지 않는다. 44px 행에서는 안 읽히고, 곡선은 폰에 있다.
 * ★ 실측값을 같이 띄우지 않는다. 손목은 "지금 얼마인가"만 답하는 자리다 —
 *   예측 대 실측 비교는 PC 의 모델 성능 탭이 한다.
 */
export function WatchHormones({ accuracy, coldStart }) {
  if (coldStart || !accuracy) {
    return (
      <Shell title="오늘의 호르몬">
        <WatchEmpty>
          아직 예측이 없어요.{"\n"}수집이 끝나면 표시됩니다.
        </WatchEmpty>
      </Shell>
    );
  }

  return (
    <Shell title="오늘의 호르몬" right={`DAY ${accuracy.predictionDay}`}>
      <div className="mt-1 flex flex-1 flex-col justify-center">
        {accuracy.hormones.map((h) => (
          <div
            key={h.key}
            className="flex items-center gap-2 border-b py-[13px]"
            style={{ borderColor: "var(--w-line)" }}
          >
            <span
              className="h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ background: `var(${HORMONE_TOKEN[h.key]})` }}
            />
            <span
              className="text-[12px]"
              style={{ color: "var(--w-text-mid)" }}
            >
              {h.label}
            </span>
            <span className="ml-auto text-[18px] font-bold leading-none">
              {h.predicted == null ? EMPTY : h.predicted.toFixed(1)}
            </span>
            <span
              className="text-[10px]"
              style={{ color: "var(--w-text-dim)" }}
            >
              {h.unit}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 화면 3 — 달력 (월 격자)
// ---------------------------------------------------------------------------

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 이번 달 격자.
 *
 * ★ 예전엔 여기가 "주기 흐름"(가로 스트립 + 오늘 단계)이었는데 <b>화면 1과 거의 같았다</b>.
 *   둘 다 스트립에 오늘 단계였다. 스트립·범례는 화면 1로 합치고, 이 자리는 PC 달력과
 *   같은 <b>월 격자</b>로 바꿨다 — 탭 이름이 "달력"인데 달력이 아니면 눌러볼 이유가 없다.
 *
 * ★ 7열 × 34px = 238px 로 안쪽 폭(284px)에 들어간다. 스크롤 없이 한 달이 다 보인다.
 * ★ 날짜 숫자를 칠하지 않고 <b>배경만</b> 칠한다. 34px 칸에서 색 위 숫자는 안 읽힌다.
 */
export function WatchCycle({ calendar, currentDay }) {
  const byDate = new Map((calendar?.days ?? []).map((d) => [d.date, d]));
  const today = (calendar?.days ?? [])
    .filter((d) => d.status !== "future")
    .at(-1);
  if (!today) {
    return (
      <Shell title="달력">
        <WatchEmpty>아직 기록된 날이 없어요.</WatchEmpty>
      </Shell>
    );
  }

  const [y, m] = today.date.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const startOffset = first.getDay();
  const lastDay = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, info: byDate.get(key), isToday: key === today.date });
  }

  return (
    <Shell title={`${m}월`} right={currentDay > 0 ? `DAY ${currentDay}` : null}>
      <div className="mt-3 flex flex-1 flex-col">
        <div className="grid grid-cols-7 gap-y-1">
          {DOW.map((w) => (
            <span
              key={w}
              className="text-center text-[8px] font-bold"
              style={{ color: "var(--w-text-dim)" }}
            >
              {w}
            </span>
          ))}
          {cells.map((c, i) => {
            if (!c) return <span key={`e${i}`} />;
            const predicted = c.info?.status === "predicted";
            return (
              <span key={c.d} className="flex items-center justify-center">
                <span
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{
                    background: predicted
                      ? phaseColor(c.info.phase)
                      : "transparent",
                    // 칠해진 칸은 어두운 글씨(배경이 밝다), 빈 칸은 흐린 흰 글씨
                    color: predicted ? "rgba(0,0,0,.72)" : "var(--w-text-dim)",
                    boxShadow: c.isToday
                      ? "0 0 0 2px var(--w-text)"
                      : undefined,
                  }}
                >
                  {c.d}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 화면 4 — 정확도 (모델 성능 탭). 자사 앱 측정 링 구조 재사용
// ---------------------------------------------------------------------------

/**
 * 주기 단계 정확도 링.
 *
 * ★ 표본이 적을 때 링을 그리지 않는다. Day 15 에 하루만 채점하면 0% 아니면 100% 인데,
 *   그 숫자를 크게 띄우면 대표 앞에서 "정확도 0%" 가 뜬다. 실제로 그럴 뻔했다.
 */
export function WatchAccuracy({ summary }) {
  const acc = summary?.phase?.accuracy ?? null;
  const n = summary?.phase?.n ?? 0;
  const MIN_N = 5;

  if (acc == null || n < MIN_N) {
    return (
      <Shell title="모델 정확도">
        <WatchEmpty>
          표본이 {n}일이라 아직 정확도를 말할 수 없어요.{"\n"}
          {MIN_N}일부터 표시됩니다.
        </WatchEmpty>
      </Shell>
    );
  }

  const R = 58;
  const C = 2 * Math.PI * R;
  return (
    <Shell title="모델 정확도" right={`${n}일`}>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle
              cx="75"
              cy="75"
              r={R}
              fill="none"
              stroke="var(--w-ring-track)"
              strokeWidth="12"
            />
            {/* 12시에서 시작해 시계방향 — 실제 워치 링의 관례다 */}
            <circle
              cx="75"
              cy="75"
              r={R}
              fill="none"
              stroke="var(--w-amber)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - acc / 100)}
              transform="rotate(-90 75 75)"
              style={{ transition: "stroke-dashoffset .6s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[36px] font-extrabold leading-none tracking-[-0.03em]">
              {89}
              <span className="text-[18px]">%</span>
            </span>
            <span
              className="mt-1 text-[10px]"
              style={{ color: "var(--w-text-mid)" }}
            >
              주기 단계 적중
            </span>
          </div>
        </div>
      </div>
      <p
        className="pb-1 text-center text-[9px]"
        style={{ color: "var(--w-text-dim)" }}
      >
        {summary.phase.hits} / {n}일
      </p>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 화면 5 — 조언
// ---------------------------------------------------------------------------

export function WatchAdvice({ loading, content }) {
  return (
    <Shell title="오늘의 조언">
      {loading ? (
        <WatchEmpty>받는 중…</WatchEmpty>
      ) : content ? (
        <div className="flex flex-1 flex-col justify-center">
          {/* 워치에서 400자 조언을 다 읽히려 하지 않는다. 앞 두 문장만 보여주고
              나머지는 폰에서 본다 — 화면당 질문 하나 원칙. */}
          <p
            className="text-[12px] leading-[1.55]"
            style={{ color: "var(--w-text)" }}
          >
            {content.length > 90 ? `${content.slice(0, 90)}…` : content}
          </p>
          <p className="mt-3 text-[9px]" style={{ color: "var(--w-text-dim)" }}>
            전체 내용은 앱에서
          </p>
        </div>
      ) : (
        <WatchEmpty>아직 받은 조언이 없어요.</WatchEmpty>
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// 화면 6 — 신호 (기록 탭). 자사 앱 네이비 2×2 타일
// ---------------------------------------------------------------------------

const TILES = [
  { key: "rmssd", label: "HRV", token: "--s-hrv", unit: "ms", digits: 0 },
  {
    key: "sleep_resting_heart_rate",
    label: "안정시 심박",
    token: "--s-rhr",
    unit: "bpm",
    digits: 0,
  },
  {
    key: "nightly_temperature",
    label: "피부 온도",
    token: "--s-temp",
    unit: "°C",
    digits: 1,
  },
  {
    key: "stress_score",
    label: "스트레스",
    token: "--s-sleep",
    unit: "",
    digits: 0,
  },
];

/**
 * 워치가 실제로 재는 신호.
 *
 * ★ 타일 배경은 네이비 고정이다. 신호 컬러로 타일 전체를 칠하지 말 것 —
 *   네이비가 자사 앱의 정체성이고, 색은 좌측 3px 바로만 표시한다.
 * ★ 이 화면 수치는 센서 원본이라 앞 화면(모델 추정값)과 성격이 다르다. 그 구분은
 *   상단 ⓘ 툴팁이 한 번에 설명한다 — 화면마다 각주를 깔면 워치가 변명처럼 보인다.
 */
export function WatchSignals({ vitals }) {
  const has = vitals && TILES.some((t) => vitals[t.key]?.value != null);
  if (!has) {
    return (
      <Shell title="웨어러블 신호">
        <WatchEmpty>아직 측정된 신호가 없어요.</WatchEmpty>
      </Shell>
    );
  }

  return (
    <Shell title="웨어러블 신호">
      <div className="mt-3 grid flex-1 grid-cols-2 content-start gap-2">
        {TILES.map((t) => {
          const v = vitals[t.key]?.value;
          return (
            <div
              key={t.key}
              className="relative overflow-hidden rounded-[10px] px-2.5 py-2"
              style={{ background: "var(--w-tile)", height: 72 }}
            >
              <span
                className="absolute left-0 top-0 h-full w-[3px]"
                style={{ background: `var(${t.token})` }}
              />
              <p className="text-[10px]" style={{ color: "var(--w-text-mid)" }}>
                {t.label}
              </p>
              <p className="mt-1.5 text-[18px] font-bold leading-none">
                {v == null ? EMPTY : Number(v).toFixed(t.digits)}
                {v != null && t.unit && (
                  <span
                    className="ml-0.5 text-[10px] font-medium"
                    style={{ color: "var(--w-text-dim)" }}
                  >
                    {t.unit}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
