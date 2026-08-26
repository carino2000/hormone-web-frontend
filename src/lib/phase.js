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

// phase 색 배경 위에 올릴 텍스트 색 — 네 색의 밝기가 달라 개별 지정한다.
// ★ 가임기가 앰버(#f5a524)로 바뀌면서 흰 글씨는 대비가 안 나온다. 어두운 글씨로 바꿨다.
//   월경기만 충분히 진해서 흰 글씨를 쓴다.
export const PHASE_TEXT_ON_COLOR = {
  Menstrual: "text-white",
  Follicular: "text-emerald-950",
  Fertility: "text-amber-950",
  Luteal: "text-violet-950",
};
