// phase(주기 단계) 표시용 공용 매핑 — PredictionSummaryCard, CycleCalendar 등에서 공유.
// 라벨은 예측 모델 계약(FRONTEND_SPEC.md 4번, mcPHASES 실데이터 기준) 4클래스로 고정:
// Menstrual / Follicular / Fertility / Luteal. 임의로 다른 키를 쓰지 말 것.
export const PHASE_LABELS_KO = {
  Menstrual: "월경기",
  Follicular: "난포기",
  Fertility: "가임기",
  Luteal: "황체기",
};

export const PHASE_COLOR_CLASS = {
  Menstrual: "bg-phase-menstruation",
  Follicular: "bg-phase-follicular",
  Fertility: "bg-phase-ovulation",
  Luteal: "bg-phase-luteal",
};

// phase 색 배경 위에 올릴 텍스트 색 — 파스텔 밝기가 달라 대비를 개별 지정.
export const PHASE_TEXT_ON_COLOR = {
  Menstrual: "text-white",
  Follicular: "text-emerald-800",
  Fertility: "text-white",
  Luteal: "text-violet-800",
};
