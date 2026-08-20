// src/api/mockData.js
// 단일 소스(one source of truth) — 모든 화면은 이 구조를 통해서만 데이터를 받는다.
// 실제 예측 모델 출력이 확정되면 이 파일의 값만 교체한다. 필드 이름·구조는 유지.
// 계약 근거: FRONTEND_SPEC.md "4. 예측 모델 계약" — mcPHASES 실데이터(merged_nan.csv,
// hormones_and_selfreport.csv) 분석을 바탕으로 다른 팀원이 만들 예측 모델의 입출력을
// 미리 가정한 것. 아직 모델이 없으므로 값·세부 수치는 그럴듯하게 채운 추정치다.

// ── 모델 입력(참고용): 프론트가 직접 안 쓰지만, "무엇으로 예측하는지" 이해용 ──
// 실제로는 하루치 웨어러블 신호 벡터를 모델이 소비한다. 프론트는 이걸 만들지 않는다.
// 예: { id, day_in_study, rmssd, nightly_temperature, resting_heart_rate, steps, glucose_mean, ... }

// ── 모델 출력(프론트가 그리는 대상) ──

// 1) 오늘의 예측 요약 (Home 화면)
export const mockPredictionSummary = {
  id: 1,
  day_in_study: 12,
  date: "2026-08-20",
  phase: "Fertility", // Menstrual | Follicular | Fertility | Luteal — 이 4개 고정
  phase_label_ko: "가임기",
  confidence: 0.78, // 0~1, 예측 확신도 (모델이 함께 반환한다고 가정 — TODO: 백엔드 확정 후 조정)
  days_to_next_event: 1, // 다음 이벤트(배란 등)까지 D-day
  next_event_label: "배란 예상",
  summary_text:
    "가임기로 예측돼요. 최근 HRV가 평소보다 낮아지고 피부온도가 오른 게 근거예요.",
};

// 2) 호르몬 추정 곡선 (Prediction Detail — 라인 차트용)
// 값 범위: lh 0~186, estrogen 0~640, pdg 1~30 (mcPHASES 실데이터 기준)
// pdg는 결측 64.7%로 매우 많음 -> null 허용, UI에서는 점선/불확실 구간으로 표현한다.
export const mockHormoneSeries = [
  { day: "D-6", lh: 2.9, estrogen: 94, pdg: null },
  { day: "D-5", lh: 1.2, estrogen: 226, pdg: null },
  { day: "D-4", lh: 3.5, estrogen: 277, pdg: 3.2 },
  { day: "D-3", lh: 1.8, estrogen: 322, pdg: 3.4 },
  { day: "D-2", lh: 12.0, estrogen: 410, pdg: null },
  { day: "D-1", lh: 80.0, estrogen: 350, pdg: 4.1 },
  { day: "D0", lh: 60.0, estrogen: 210, pdg: 9.0 },
];

// 3) 예측 근거 / 신호 기여도 (Prediction Detail — 막대, SHAP 개념)
export const mockContributions = [
  { signal: "HRV(rmssd) 감소", feature: "rmssd", weight: 0.34, direction: "up" },
  { signal: "야간 피부온도 상승", feature: "nightly_temperature", weight: 0.27, direction: "up" },
  { signal: "안정시 심박 상승", feature: "resting_heart_rate", weight: 0.18, direction: "up" },
  { signal: "수면 점수 저하", feature: "overall_score", weight: 0.12, direction: "down" },
  { signal: "활동량 변화", feature: "steps", weight: 0.09, direction: "down" },
];

// 4) 오늘의 생체신호 요약 (Home — 뱃지/미니차트). baseline = 개인 평소값
export const mockVitals = {
  rmssd: { value: 42, baseline: 55, unit: "ms" },
  nightly_temp: { value: 36.8, baseline: 36.4, unit: "°C" },
  resting_hr: { value: 68, baseline: 61, unit: "bpm" },
  sleep_score: { value: 72, baseline: 80, unit: "" },
  glucose_mean: { value: 98, baseline: 92, unit: "mg/dL" }, // 실제로는 일부 참가자만 보유하는 값
};

// 5) 다음 이벤트 예측 (Prediction Detail)
export const mockNextEvents = {
  lh_surge_expected: "D-1 ~ D0",
  fertility_window_prob: 0.81, // 0~1
};

// 6) 주기 달력 (Calendar — 날짜별 예측 phase)
// TODO: 백엔드 확정 후 조정 — 앵커 지점(월경 8/10, 난포 8/15, 가임기 8/19, 황체 8/22)을 기준으로
// 한 달치를 보간해서 채움. 실제로는 모델이 매일 phase를 반환할 것으로 가정.
export const mockCalendar = {
  month: "2026-08",
  days: [
    { date: "2026-08-01", phase: "Luteal" },
    { date: "2026-08-02", phase: "Luteal" },
    { date: "2026-08-03", phase: "Luteal" },
    { date: "2026-08-04", phase: "Luteal" },
    { date: "2026-08-05", phase: "Luteal" },
    { date: "2026-08-06", phase: "Luteal" },
    { date: "2026-08-07", phase: "Luteal" },
    { date: "2026-08-08", phase: "Luteal" },
    { date: "2026-08-09", phase: "Luteal" },
    { date: "2026-08-10", phase: "Menstrual" },
    { date: "2026-08-11", phase: "Menstrual" },
    { date: "2026-08-12", phase: "Menstrual" },
    { date: "2026-08-13", phase: "Menstrual" },
    { date: "2026-08-14", phase: "Menstrual" },
    { date: "2026-08-15", phase: "Follicular" },
    { date: "2026-08-16", phase: "Follicular" },
    { date: "2026-08-17", phase: "Follicular" },
    { date: "2026-08-18", phase: "Follicular" },
    { date: "2026-08-19", phase: "Fertility" },
    { date: "2026-08-20", phase: "Fertility" },
    { date: "2026-08-21", phase: "Fertility" },
    { date: "2026-08-22", phase: "Luteal" },
    { date: "2026-08-23", phase: "Luteal" },
    { date: "2026-08-24", phase: "Luteal" },
    { date: "2026-08-25", phase: "Luteal" },
    { date: "2026-08-26", phase: "Luteal" },
    { date: "2026-08-27", phase: "Luteal" },
    { date: "2026-08-28", phase: "Luteal" },
    { date: "2026-08-29", phase: "Luteal" },
    { date: "2026-08-30", phase: "Luteal" },
    { date: "2026-08-31", phase: "Luteal" },
  ],
  next_period_estimate: "2026-09-03",
};
