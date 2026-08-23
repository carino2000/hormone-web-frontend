// 백엔드 timeline 응답을 목업 픽스처와 "똑같은 모양"으로 정규화하는 어댑터.
//
// 이 파일이 있어서 api/index.js 와 pages/*, components/* 는 한 줄도 바뀌지 않는다.
// 백엔드 계약이 바뀌면 여기 normalizeTimeline 만 고치면 된다.
import { endpoints } from "../api/endpoints";
import { httpGet } from "../api/http";
import { WEARABLE_KEYS } from "../lib/wearableCatalog";

const PHASE_LABEL_KO = {
  Menstrual: "월경기",
  Follicular: "난포기",
  Fertility: "가임기",
  Luteal: "황체기",
};

const num = (v) => (v === null || v === undefined ? null : Number(v));

/**
 * 백엔드가 주는 웨어러블 44개를 전부 숫자로 정규화해서 그대로 들고 있는다.
 *
 * 예전에는 여기서 화면이 쓰는 6개만 추렸는데, 그러면 "추려낼 6개"가 이 파일과
 * api/index.js 두 군데에 각각 박혀서 동기화가 깨진다. 무엇을 보여줄지는
 * 화면 층(api/index.js + lib/wearableCatalog.js)이 정하고, 이 어댑터 층은
 * 백엔드 응답을 있는 그대로 통과시킨다.
 *
 * 결측은 null 로 남긴다. 키는 44개가 항상 다 존재한다.
 */
function normalizeWearable(wearable) {
  const out = {};
  for (const key of WEARABLE_KEYS) {
    out[key] = num(wearable?.[key]);
  }
  return out;
}

// 백엔드 PredictionDto -> 픽스처의 days[].prediction 모양
function normalizePrediction(p, dayIndex) {
  if (!p) return null;
  return {
    phase: p.phase ?? null,
    phaseLabelKo: p.phaseLabelKo ?? (p.phase ? PHASE_LABEL_KO[p.phase] : null),
    confidence: num(p.confidence),
    lh: num(p.lh),
    estrogen: num(p.estrogen),
    pdg: num(p.pdg),
    // 프론트 목업은 nextEvent 를 갖고 있지만 백엔드는 안 준다.
    // 다음 월경 예정일로부터 D-day 를 계산해서 채운다.
    nextEvent: buildNextEvent(p, dayIndex),
    nextPeriod: p.nextPeriod
      ? {
          date: p.nextPeriod.date ?? null,
          rangeStart: p.nextPeriod.rangeStart ?? null,
          rangeEnd: p.nextPeriod.rangeEnd ?? null,
        }
      : null,
    summaryText: buildSummaryText(p),
    contributions: (p.contributions ?? []).map((c) => ({
      signal: c.signal ?? c.feature,
      feature: c.feature,
      weight: num(c.weight),
      direction: c.direction,
    })),
    // 데이터 출처 배지(P-03)의 판정 근거. `mock-` 으로 시작하면 내장 Mock 예측기다.
    // 이걸 빠뜨리면 배지가 Mock 을 구분하지 못해 "실제 모델"처럼 보인다.
    modelVersion: p.modelVersion ?? null,
  };
}

function buildNextEvent(p, dayIndex) {
  if (!p.nextPeriod?.date || !p.date) return null;
  const from = new Date(p.date);
  const to = new Date(p.nextPeriod.date);
  const daysTo = Math.max(0, Math.round((to - from) / 86_400_000));
  return { label: "다음 월경 예상", daysTo, dayIndex };
}

// 모델이 요약 문구를 주지 않으므로 phase + 최상위 기여 신호로 조합한다.
// 단정형을 피하고 "추정" 어조를 유지한다 (안전 원칙).
function buildSummaryText(p) {
  if (!p.phase) return null;
  const ko = p.phaseLabelKo ?? PHASE_LABEL_KO[p.phase] ?? p.phase;
  const top = p.contributions?.[0];
  if (!top) return `${ko}로 추정돼요.`;
  return `${ko}로 추정돼요. ${top.signal ?? top.feature}이(가) 근거예요.`;
}

/**
 * 백엔드 timeline -> 픽스처와 동일한 구조.
 * { baseline, coldStartDays, totalDays, currentDay, days: [{day, date, wearable, prediction}] }
 */
export function normalizeTimeline(timeline) {
  return {
    baseline: normalizeWearable(timeline.baseline ?? {}),
    coldStartDays: timeline.coldStartDays,
    totalDays: timeline.totalDays,
    currentDay: timeline.currentDay,
    status: timeline.status,
    days: (timeline.days ?? []).map((d) => ({
      day: d.day,
      date: d.date,
      wearable: normalizeWearable(d.wearable),
      prediction: normalizePrediction(d.prediction, d.day),
      truth: normalizeTruth(d.truth),
    })),
  };
}

// 실측 정답 라벨. 백엔드는 예측이 있는 날에만 내려준다(콜드스타트 스포일러 방지).
function normalizeTruth(t) {
  if (!t) return null;
  return {
    phase: t.phase ?? null,
    lh: num(t.lh),
    estrogen: num(t.estrogen),
    pdg: num(t.pdg),
  };
}

export async function fetchTimeline() {
  return normalizeTimeline(await httpGet(endpoints.demoTimeline()));
}

export async function fetchState() {
  return httpGet(endpoints.demoState());
}

/**
 * 예측 요청 이력. targetDate 로 찾을 수 있게 Map 으로 만든다.
 *
 * 타임라인과 달리 **캐시하지 않는다** — 잡 상태는 PENDING → SUCCEEDED 로 바뀌므로
 * 볼 때마다 새로 받아야 한다. 응답이 작아서(요약만) 매번 받아도 부담 없다.
 *
 * ★ 백엔드가 이 엔드포인트를 아직 안 가진 구버전일 수도 있다(노트북 이동 등).
 *   그때 기록 탭 전체가 죽으면 안 되므로 실패는 빈 Map 으로 삼킨다.
 */
export async function fetchJobsByDate() {
  try {
    const jobs = await httpGet(endpoints.demoJobs());
    const byDate = new Map();
    for (const j of jobs ?? []) {
      // 같은 날짜에 여러 건이면 최신(id 큰 것)만 쓴다. 응답이 id 내림차순이라 첫 건이 최신이다.
      if (!byDate.has(j.targetDate)) byDate.set(j.targetDate, j);
    }
    return byDate;
  } catch {
    return new Map();
  }
}
