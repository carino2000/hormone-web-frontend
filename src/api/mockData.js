// src/api/mockData.js
// 단일 소스(one source of truth) — 모든 화면은 이 구조를 통해서만 데이터를 받는다.
// 실제 백엔드 계약이 확정되면 이 파일의 값만 교체한다. 필드 이름·구조는 유지.

// 1) 오늘의 예측 요약 (Home 화면)
export const mockPredictionSummary = {
  date: "2026-08-19",
  phase: "ovulation", // menstruation | follicular | ovulation | luteal
  phase_label_ko: "배란기", // 화면 표시용 한글
  confidence: 0.78, // 0~1, 예측 확신도
  days_to_ovulation: 2, // 배란까지 D-day (음수면 이미 지남)
  summary_text:
    "배란 가능성이 높은 시기로 보여요. 최근 HRV가 평소보다 낮아지고 피부온도가 오른 게 근거예요.",
};

// 2) 호르몬 추정 곡선 (Prediction Detail — 라인 차트용)
export const mockHormoneSeries = [
  // day: 관찰 상대일 or 날짜 라벨
  { day: "D-6", LH: 12, E3G: 40, PdG: 5 },
  { day: "D-5", LH: 14, E3G: 55, PdG: 5 },
  { day: "D-4", LH: 18, E3G: 70, PdG: 6 },
  { day: "D-3", LH: 25, E3G: 90, PdG: 6 },
  { day: "D-2", LH: 45, E3G: 110, PdG: 7 },
  { day: "D-1", LH: 80, E3G: 95, PdG: 9 },
  { day: "D0", LH: 60, E3G: 70, PdG: 14 },
];

// 3) 예측 근거 / 신호 기여도 (Prediction Detail — 막대)
export const mockContributions = [
  { signal: "HRV 감소", label: "HRV", weight: 0.34, direction: "up" }, // weight: 기여도 0~1
  { signal: "피부온도 상승", label: "Skin Temp", weight: 0.27, direction: "up" },
  { signal: "안정시 심박 상승", label: "Resting HR", weight: 0.18, direction: "up" },
  { signal: "수면 질 저하", label: "Sleep", weight: 0.12, direction: "down" },
  { signal: "활동량 변화", label: "Activity", weight: 0.09, direction: "down" },
];

// 4) 오늘의 생체신호 요약 (Home — 뱃지/미니차트)
export const mockVitals = {
  hrv: { value: 42, baseline: 55, unit: "ms" }, // baseline = 개인 평소값
  skin_temp: { value: 36.8, baseline: 36.4, unit: "°C" },
  resting_hr: { value: 68, baseline: 61, unit: "bpm" },
  sleep_score: { value: 72, baseline: 80, unit: "" },
};

// 5) 다음 이벤트 예측 (Prediction Detail)
export const mockNextEvents = {
  lh_surge_expected: "D-1 ~ D0",
  ovulation_window_prob: 0.81, // 0~1
};

// 6) 주기 달력 (Calendar — 날짜별 예측 단계)
// TODO: 백엔드 확정 후 조정 — 앵커 지점(월경 8/10, 난포 8/15, 배란 8/19, 황체 8/25)을 기준으로
// 한 달치를 보간해서 채움. 실제로는 모델이 매일 phase를 반환할 것으로 가정.
export const mockCalendar = {
  month: "2026-08",
  days: [
    { date: "2026-08-01", phase: "luteal" },
    { date: "2026-08-02", phase: "luteal" },
    { date: "2026-08-03", phase: "luteal" },
    { date: "2026-08-04", phase: "luteal" },
    { date: "2026-08-05", phase: "luteal" },
    { date: "2026-08-06", phase: "luteal" },
    { date: "2026-08-07", phase: "luteal" },
    { date: "2026-08-08", phase: "luteal" },
    { date: "2026-08-09", phase: "luteal" },
    { date: "2026-08-10", phase: "menstruation" },
    { date: "2026-08-11", phase: "menstruation" },
    { date: "2026-08-12", phase: "menstruation" },
    { date: "2026-08-13", phase: "menstruation" },
    { date: "2026-08-14", phase: "menstruation" },
    { date: "2026-08-15", phase: "follicular" },
    { date: "2026-08-16", phase: "follicular" },
    { date: "2026-08-17", phase: "follicular" },
    { date: "2026-08-18", phase: "follicular" },
    { date: "2026-08-19", phase: "ovulation" },
    { date: "2026-08-20", phase: "ovulation" },
    { date: "2026-08-21", phase: "ovulation" },
    { date: "2026-08-22", phase: "luteal" },
    { date: "2026-08-23", phase: "luteal" },
    { date: "2026-08-24", phase: "luteal" },
    { date: "2026-08-25", phase: "luteal" },
    { date: "2026-08-26", phase: "luteal" },
    { date: "2026-08-27", phase: "luteal" },
    { date: "2026-08-28", phase: "luteal" },
    { date: "2026-08-29", phase: "luteal" },
    { date: "2026-08-30", phase: "luteal" },
    { date: "2026-08-31", phase: "luteal" },
  ],
  next_period_estimate: "2026-09-06",
};
