// 웨어러블 44개 피처의 "화면 표시 방법" 단일 진실.
//
// 백엔드 WearableFeatures.java 가 DB 컬럼명의 단일 진실이고, 이 파일은 그 44개를
// 사람이 읽을 수 있게 만드는 층이다. 키는 반드시 DB 컬럼명과 1:1 로 같아야 한다
// (모델 피처명이 아니다 — 일간 안정시심박은 DB 'resting_heart_rate', 모델 'value').
//
// scale 은 저장 단위 -> 표시 단위 변환 배수다. originalduration 이 밀리초로 들어와서
// 그대로 찍으면 "5334000" 이 나오기 때문에 있다.

/** 표시 순서 = 그룹 순서. 패널이 이 순서로 섹션을 만든다. */
export const WEARABLE_GROUPS = [
  "수면",
  "호흡",
  "심박 · HRV",
  "체온",
  "활동 · 운동",
  "심박존",
  "대사 · 기타",
];

const F = (key, label, group, { unit = "", decimals = 0, scale = 1, home = false } = {}) => ({
  key,
  label,
  group,
  unit,
  decimals,
  scale,
  home,
});

export const WEARABLE_CATALOG = [
  // ---- 수면 (7) ----
  F("minutesasleep", "수면 시간", "수면", { unit: "분", decimals: 0 }),
  F("deep_sleep_in_minutes", "깊은 수면", "수면", { unit: "분", decimals: 0 }),
  F("minutesawake", "각성 시간", "수면", { unit: "분", decimals: 0 }),
  F("efficiency", "수면 효율", "수면", { unit: "%", decimals: 0 }),
  F("overall_score", "수면 점수", "수면", { unit: "", decimals: 0 }),
  F("restlessness", "뒤척임", "수면", { unit: "", decimals: 3, home: true }),
  F("nap_minutes_total", "낮잠", "수면", { unit: "분", decimals: 0 }),

  // ---- 호흡 (4) ----
  F("full_sleep_breathing_rate", "수면 호흡수", "호흡", { unit: "회/분", decimals: 1 }),
  F("deep_sleep_breathing_rate", "깊은수면 호흡수", "호흡", { unit: "회/분", decimals: 1 }),
  F("light_sleep_breathing_rate", "얕은수면 호흡수", "호흡", { unit: "회/분", decimals: 1 }),
  F("rem_sleep_breathing_rate", "REM 호흡수", "호흡", { unit: "회/분", decimals: 1 }),

  // ---- 심박 · HRV (8) ----
  // ★ 안정시 심박이 두 개다. 일간(소수)과 수면중(정수)은 다른 센서 파이프라인이고
  //   배란기 신호 강도도 완전히 다르다 (일간 0.01 / 수면중 0.79).
  F("sleep_resting_heart_rate", "안정시 심박 (수면)", "심박 · HRV", { unit: "bpm", decimals: 0, home: true }),
  F("resting_heart_rate", "안정시 심박 (일간)", "심박 · HRV", { unit: "bpm", decimals: 1 }),
  F("rmssd", "HRV (RMSSD)", "심박 · HRV", { unit: "ms", decimals: 1, home: true }),
  F("low_frequency", "HRV 저주파", "심박 · HRV", { unit: "ms²", decimals: 0 }),
  F("high_frequency", "HRV 고주파", "심박 · HRV", { unit: "ms²", decimals: 0 }),
  F("bpm", "평균 심박", "심박 · HRV", { unit: "bpm", decimals: 1 }),
  F("bpm_min", "최저 심박", "심박 · HRV", { unit: "bpm", decimals: 0 }),
  F("bpm_max", "최고 심박", "심박 · HRV", { unit: "bpm", decimals: 0 }),

  // ---- 체온 (3) ----
  // Fitbit 피부온도다. 체온(36.5°C)이 아니라 실측 31~35°C —
  // "체온"이라고 쓰면 사용자가 발열로 오해한다.
  F("nightly_temperature", "야간 피부온도", "체온", { unit: "°C", decimals: 2, home: true }),
  F("temperature_diff_from_baseline", "피부온도 편차", "체온", { unit: "°C", decimals: 2 }),
  F("temperature_samples", "온도 샘플 수", "체온", { unit: "개", decimals: 0 }),

  // ---- 활동 · 운동 (10) ----
  F("calories", "소모 칼로리", "활동 · 운동", { unit: "kcal", decimals: 0, home: true }),
  F("sedentary", "좌식 시간", "활동 · 운동", { unit: "분", decimals: 0 }),
  F("lightly", "가벼운 활동", "활동 · 운동", { unit: "분", decimals: 0 }),
  F("moderately", "중강도 활동", "활동 · 운동", { unit: "분", decimals: 0 }),
  F("very", "고강도 활동", "활동 · 운동", { unit: "분", decimals: 0 }),
  F("altitude", "고도 상승", "활동 · 운동", { unit: "m", decimals: 0 }),
  // ★ steps 는 총 걸음수가 아니라 exercise.csv 의 "기록된 운동 세션" 걸음수다.
  //   originalduration / averageheartrate / exercise_calories 와 항상 함께 있거나
  //   함께 없다(90일 중 예외 0건). 운동을 기록 안 한 날은 통째로 결측이다.
  F("steps", "운동 걸음 수", "활동 · 운동", { unit: "보", decimals: 0 }),
  F("originalduration", "운동 시간", "활동 · 운동", { unit: "분", decimals: 0, scale: 1 / 60000 }),
  F("averageheartrate", "운동 중 심박", "활동 · 운동", { unit: "bpm", decimals: 0 }),
  F("exercise_calories", "운동 칼로리", "활동 · 운동", { unit: "kcal", decimals: 0 }),

  // ---- 심박존 (7) ----
  F("below_default_zone_1", "존1 미만", "심박존", { unit: "분", decimals: 0 }),
  F("in_default_zone_1", "존1 체류", "심박존", { unit: "분", decimals: 0 }),
  F("in_default_zone_2", "존2 체류", "심박존", { unit: "분", decimals: 0 }),
  F("in_default_zone_3", "존3 체류", "심박존", { unit: "분", decimals: 0 }),
  F("FAT_BURN", "지방연소 존", "심박존", { unit: "분", decimals: 0 }),
  F("CARDIO", "유산소 존", "심박존", { unit: "분", decimals: 0 }),
  F("PEAK", "최대 존", "심박존", { unit: "분", decimals: 0 }),

  // ---- 대사 · 기타 (5) ----
  F("stress_score", "스트레스 점수", "대사 · 기타", { unit: "", decimals: 0, home: true }),
  F("filtered_demographic_vo2_max", "VO2 max", "대사 · 기타", { unit: "mL/kg/min", decimals: 1 }),
  F("spo2_variation_std", "산소포화도 변동", "대사 · 기타", { unit: "%", decimals: 2 }),
  // 단위는 mmol/L 다. mg/dL 아님 — mcPHASES 혈당은 Dexcom CGM, 실측 5.4~6.6 범위.
  F("glucose_mean", "평균 혈당", "대사 · 기타", { unit: "mmol/L", decimals: 1 }),
  F("glucose_std", "혈당 변동", "대사 · 기타", { unit: "mmol/L", decimals: 2 }),
];

/** DB 컬럼명 -> 카탈로그 항목 */
export const WEARABLE_BY_KEY = Object.fromEntries(WEARABLE_CATALOG.map((f) => [f.key, f]));

export const WEARABLE_KEYS = WEARABLE_CATALOG.map((f) => f.key);

/**
 * 홈 "오늘의 생체신호" 타일에 띄우는 6개.
 *
 * 44개를 전부 타일로 깔면 제품 화면이 아니라 계기판 덤프가 된다. 전체 44개는
 * 예측 상세의 ModelInputPanel 이 따로 보여준다 — 여기는 "읽히는" 것만 남긴다.
 *
 * 고른 기준은 이 참가자 90일 실측에서 잰 배란기 신호 강도(|평균차| / 표준편차)와
 * 결측률이다. 도메인 감으로 고른 게 아니다.
 *
 *   sleep_resting_heart_rate  0.79 / 결측 2.2%
 *   restlessness              0.69 / 결측 2.2%
 *   stress_score              0.68 / 결측 4.4%
 *   rmssd                     0.39 / 결측 0%
 *   nightly_temperature       0.17 / 결측 1.1%   (신호는 약하지만 설명이 쉬워서 유지)
 *   calories                  0.08 / 결측 0%     (신호용이 아니라 "움직임" 맥락용 한 칸)
 *
 * 제외한 것:
 *   glucose_mean       이 참가자 2024구간은 CGM 미착용 -> 90일 내내 100% 결측.
 *                      타일이 영원히 "측정 안 됨"으로 남아서 뺐다.
 *   resting_heart_rate 일간 안정시 심박. 배란기 신호 0.01 — 사실상 없다.
 *                      수면중 값(0.79)으로 대체했다.
 *   steps              ★ 원본 데이터에 손상된 값이 섞여 있다. 이 참가자 Day 22
 *                      (day_in_study 883)가 626,947보인데 같은 행의 운동시간이
 *                      274분이다 — 분당 2,270보라 불가능한 값이다. 데이터셋 전체로도
 *                      steps 상위 0.30%가 2만 보를 넘고 최댓값이 938,808 이다.
 *                      결측 20% 에 신호도 0.15 로 약해서, 홈 타일에서는 내리고
 *                      44개 패널에만 남겼다. 원본 값은 고치지 않는다 —
 *                      모델팀이 알아야 할 데이터 품질 문제라 지우면 안 된다.
 *   in_default_zone_3  신호 0.60 으로 세지만 90일 중앙값이 0, 최댓값이 11분이다.
 *                      타일에 넣으면 거의 매일 "0분"이라 화면상 죽은 칸이 된다.
 */
export const HOME_VITAL_KEYS = [
  "rmssd",
  "sleep_resting_heart_rate",
  "restlessness",
  "stress_score",
  "nightly_temperature",
  "calories",
];

/** 표시용 숫자 변환. 저장 단위 -> 표시 단위. */
export function toDisplayValue(key, value) {
  if (value === null || value === undefined) return null;
  const meta = WEARABLE_BY_KEY[key];
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return meta ? n * meta.scale : n;
}

export function formatWearable(key, value) {
  const v = toDisplayValue(key, value);
  if (v === null) return null;
  const meta = WEARABLE_BY_KEY[key];
  return v.toFixed(meta?.decimals ?? 0);
}
