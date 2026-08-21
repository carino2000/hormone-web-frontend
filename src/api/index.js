// src/api/index.js — 교체 지점. 화면 컴포넌트는 simulationDays.json이나
// simulationSource.js를 직접 건드리지 않고 반드시 이 함수들을 통해서만 데이터를 받는다.
// dataSource가 'api'로 바뀌면 이 파일 안쪽만 실제 fetch 호출로 교체하면 된다.
import { BASELINE, COLD_START_DAYS, getAllDays, getDaySnapshot, getDaysUpTo } from "../data/simulationSource";
import { PHASE_LABELS_KO } from "../lib/phase";

export { COLD_START_DAYS };

export const isColdStartDay = (day) => day < COLD_START_DAYS;

const VITALS_UNIT = {
  rmssd: "ms",
  nightly_temperature: "°C",
  resting_heart_rate: "bpm",
  overall_score: "",
  glucose_mean: "mg/dL",
  steps: "보",
};

export const VITALS_LABEL_KO = {
  rmssd: "HRV",
  nightly_temperature: "야간 피부온도",
  resting_heart_rate: "안정시 심박",
  overall_score: "수면 점수",
  glucose_mean: "평균 혈당",
  steps: "활동량",
};

export async function getPredictionSummary(day, dataSource) {
  const snap = getDaySnapshot(day, { dataSource });
  if (!snap) return null;
  const { prediction } = snap;
  return {
    day,
    date: snap.date,
    phase: prediction.phase,
    phase_label_ko: PHASE_LABELS_KO[prediction.phase],
    confidence: prediction.confidence,
    days_to_next_event: prediction.nextEvent.daysTo,
    next_event_label: prediction.nextEvent.label,
    summary_text: prediction.summaryText,
  };
}

export async function getVitals(day, dataSource) {
  const snap = getDaySnapshot(day, { dataSource });
  if (!snap) return null;
  return Object.fromEntries(
    Object.entries(snap.wearable).map(([key, value]) => [
      key,
      { value, baseline: BASELINE[key] ?? null, unit: VITALS_UNIT[key] ?? "" },
    ]),
  );
}

// 예측 상세 탭의 누적 그래프용 — day까지의 전체 시계열. 콜드스타트 구간(< COLD_START_DAYS)은
// 아직 모델 출력이 없으므로 null로 비워서 차트에서 20일차부터 선이 그려지게 한다.
export async function getHormoneSeries(day, dataSource) {
  return getDaysUpTo(day, { dataSource }).map((d) => ({
    day: d.day,
    date: d.date,
    lh: d.day < COLD_START_DAYS ? null : d.prediction.lh,
    estrogen: d.day < COLD_START_DAYS ? null : d.prediction.estrogen,
    pdg: d.day < COLD_START_DAYS ? null : d.prediction.pdg,
  }));
}

export async function getContributions(day, dataSource) {
  const snap = getDaySnapshot(day, { dataSource });
  return snap ? snap.prediction.contributions : [];
}

export async function getNextEvents(day, dataSource) {
  const snap = getDaySnapshot(day, { dataSource });
  if (!snap) return null;
  return {
    next_event_label: snap.prediction.nextEvent.label,
    days_to_next_event: snap.prediction.nextEvent.daysTo,
    next_period: snap.prediction.nextPeriod,
  };
}

// 캘린더는 day 시점까지 "도달한" 날짜만 상태를 갖는다. 아직 시뮬레이터가 넘기지 않은
// 미래 일차는 future로 비워 두어 예측을 미리 스포일링하지 않는다.
export async function getCalendar(day, dataSource) {
  const days = getAllDays({ dataSource }).map((d) => {
    if (d.day > day) return { date: d.date, status: "future" };
    if (d.day < COLD_START_DAYS) return { date: d.date, status: "collecting" };
    return { date: d.date, status: "predicted", phase: d.prediction.phase };
  });
  const current = getDaySnapshot(day, { dataSource });
  return {
    days,
    next_period_estimate: current && day >= COLD_START_DAYS ? current.prediction.nextPeriod.date : null,
  };
}
