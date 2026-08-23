# FRONTEND_SPEC.md — 호르몬 예측 대시보드 프론트엔드 작업 지시서

> Claude Code에게 넘기는 프론트엔드 작업 지시서.
> 프로젝트: 식스레터스 PoC — mcPHASES 기반 여성호르몬 예측 대시보드
> 이 문서를 끝까지 읽고 "0. 절대 규칙"을 지킬 것.

---

## 0. 절대 규칙 (위반 금지)

1. **언어는 JavaScript (JSX)로 작성한다. TypeScript 아님.** (`.tsx/.ts` 만들지 말 것)
2. **모든 데이터는 mock(가짜)이다. 실제 API 호출(`fetch`/`axios`) 코드를 넣지 마라.**
   - 백엔드/모델은 아직 없다. req/resp 계약도 미확정이다.
   - 아래 "4. 예측 모델 계약"을 **단일 소스**로 삼고, 교체 지점을 `src/api/`에 격리한다.
3. **이 앱은 "예측 대시보드"다. 생리주기 트래킹 앱이 아니다.** 레퍼런스 이미지는 **색감·톤만** 참고, 기능은 안 베낀다.
4. **로그인/회원가입/인증 없음.** 단일 가상 사용자.
5. 세부 디자인은 자유롭게 예쁘게. 단 "3. 화면", "4. 계약", "5. 디바이스 탭"의 틀은 지킨다.

---

## 1. 프로젝트 배경

- 스마트워치(Fitbit류) 생체신호로 **여성 호르몬 수치와 주기 단계를 예측**하는 AI PoC의 프론트엔드.
- 예측 모델(파이썬)은 **다른 팀원이** 만든다. 이 프론트는 그 **출력을 받아서 보여주는** 역할.
- 모델 출력 형식이 아직 확정 안 됐다. 그래서 **우리가 먼저 mock 계약으로 UI를 만들고**, 실제 형식이 오면 mock만 교체한다.
- **이번 PoC 범위:** 저장 데이터 기반 예측 결과를 "시각적으로 완성도 있게" 보여주는 데모. 실시간 스트리밍은 범위 밖.

---

## 2. 예측 모델이 하는 일 (프론트가 이해해야 할 핵심)

실제 학습 데이터(mcPHASES) 2개 파일을 확인한 결과, 모델의 정체는 다음과 같다.

### 데이터 관계
- **`merged_nan.csv`** = 전체 데이터. 웨어러블 신호 약 50개 컬럼 + 호르몬 정답 3개 + 메타. (5,436행 / 참가자 40명 / 2022·2024 관찰)
- **`hormones_and_selfreport.csv`** = 위 데이터에서 **정답(y) 부분만 발췌**한 것. 컬럼: `id, study_interval, is_weekend, day_in_study, phase, lh, estrogen, pdg`.
- 즉 **학습**: merged의 웨어러블 신호(X)로 호르몬·주기(y)를 맞히도록 학습. **정답지**는 hormones 파일.

### 모델 입력(X) — 웨어러블/생체 신호 (예시, 실제는 더 많음)
심박(`bpm`, `averageheartrate`, `resting_heart_rate`), 심박변이도(`rmssd`, `low_frequency`, `high_frequency`),
체온(`nightly_temperature`, `temperature_diff_from_baseline`), 수면(`minutesasleep`, `efficiency`, `overall_score`, `deep_sleep_in_minutes`),
활동량(`steps`, `calories`, `sedentary/lightly/moderately/very`, 심박존), 호흡률, 혈당(`glucose_mean/std`), VO2max, SpO2 변이, 스트레스 점수,
정적 정보(`birth_year`→나이, `age_of_first_menarche`, `ethnicity`), 시간축(`day_in_study`, `is_weekend`, `study_interval`).

### 모델 출력(y) — 프론트가 화면에 그릴 대상 ★
| 출력 | 타입 | 실제 값 범위(데이터 기준) | 비고 |
|---|---|---|---|
| `lh` (황체형성호르몬) | 회귀(수치) | 0 ~ 186, 중앙값 4.5 | 결측 0% — 신뢰도 높음 |
| `estrogen` (에스트로겐/E3G) | 회귀(수치) | 0 ~ 640, 중앙값 102 | 결측 0% — 신뢰도 높음 |
| `pdg` (프로게스테론/PdG) | 회귀(수치) | 1 ~ 30, 중앙값 3.4 | **결측 64.7%** — 예측 신뢰도 낮을 수 있음. "예측 불가/낮음" 상태 UI 필요 |
| `phase` (주기 단계) | 분류(4클래스) | `Menstrual` / `Follicular` / `Fertility` / `Luteal` | ★ 라벨 이 4개로 고정. 임의로 바꾸지 말 것 |

> **중요:** 주기 단계 라벨은 반드시 **`Menstrual`, `Follicular`, `Fertility`, `Luteal`** 4개를 쓴다.
> (`ovulation` 같은 다른 라벨 쓰지 말 것 — 실제 데이터가 이 4개다. `Fertility`가 가임기/배란기에 해당.)

### 도메인 최소 지식 (UI 문구용)
- 호르몬 흐름: `estrogen` 상승 → `lh` 급상승(배란 방아쇠) → 배란 → `pdg` 상승(배란 후).
- 주기 순서: `Menstrual`(월경) → `Follicular`(난포기) → `Fertility`(가임기) → `Luteal`(황체기).
- 예측 근거(설명가능성/SHAP): 어떤 신호가 예측에 얼마나 기여했는지 → UI에선 "기여도 막대".

---

## 3. 화면 구성 (큰 틀만 — 세부 자유)

### 3-1. Home / 예측 요약 (메인)
- **오늘의 예측 카드:** 현재 `phase` + 배란/다음이벤트 D-day + 예측 확신도(`confidence` %). 원형 게이지로 강조.
- **자연어 요약:** 모델 설명 문장(`summary_text`)을 배너/말풍선으로.
- **핵심 생체신호 요약:** HRV(`rmssd`)·피부온도 등 오늘 값 + "평소(baseline) 대비" 뱃지.

### 3-2. Prediction Detail / 예측 상세 (우리 프로젝트의 차별점)
- **호르몬 곡선:** 최근 N일 `lh`/`estrogen`/`pdg` 추정치 라인 차트(recharts). pdg는 결측 많으니 "점선/불확실" 표현 고려.
- **예측 근거(기여도):** 신호별 기여도 가로 막대(SHAP 개념).
- **다음 이벤트 예측:** LH surge 예상 시점, 가임 윈도우 확률 등.

### 3-3. Calendar / 주기 달력
- 월 단위 달력, 날짜별 예측 `phase`를 색으로 표시.
- 하단 "다음 월경 예상: OO월 OO일경" 요약 배너.

> 페이지 전환은 하단 탭바/사이드 내비 (디자인 자유).

---

## 4. 예측 모델 계약 (⚠️ 단일 소스 — 모든 화면이 이걸로만 그린다)

`src/api/mockData.js`에 정의. **이 구조가 곧 백엔드에 제안할 계약 초안이다.** 실제 형식 오면 여기만 교체.
필드명·구조는 유지, 값은 자유롭게 그럴듯하게. 라벨/범위는 위 "2. 모델 출력"을 따른다.

```js
// src/api/mockData.js

// ── 모델 입력(참고용): 프론트가 직접 안 쓰지만, "무엇으로 예측하는지" 이해용 ──
// 실제로는 하루치 웨어러블 신호 벡터. 프론트는 이걸 만들지 않는다(모델이 소비).
// 예: { id, day_in_study, rmssd, nightly_temperature, resting_heart_rate, steps, glucose_mean, ... }

// ── 모델 출력(프론트가 그리는 대상) ──

// 1) 오늘의 예측 요약 (Home)
export const mockPredictionSummary = {
  id: 1,
  day_in_study: 12,
  date: "2026-08-19",              // 표시용(원본은 day_in_study 상대일. 데모용 날짜 매핑 허용)
  phase: "Fertility",              // Menstrual | Follicular | Fertility | Luteal  <- 이 4개 고정
  phase_label_ko: "가임기",
  confidence: 0.78,                // 0~1 예측 확신도 (모델이 함께 반환한다고 가정)
  days_to_next_event: 2,           // 다음 이벤트(배란 등)까지 D-day
  next_event_label: "배란 예상",
  summary_text: "가임기로 예측돼요. 최근 HRV가 평소보다 낮아지고 피부온도가 오른 게 근거예요.",
};

// 2) 호르몬 추정 곡선 (Prediction Detail — 라인 차트)
//    값 범위: lh 0~186, estrogen 0~640, pdg 1~30 (실제 데이터 기준)
//    pdg는 결측 많음 -> null 허용, UI에서 "불확실"로 표현
export const mockHormoneSeries = [
  { day: "D-6", lh: 2.9,  estrogen: 94,  pdg: null },
  { day: "D-5", lh: 1.2,  estrogen: 226, pdg: null },
  { day: "D-4", lh: 3.5,  estrogen: 277, pdg: 3.2 },
  { day: "D-3", lh: 1.8,  estrogen: 322, pdg: 3.4 },
  { day: "D-2", lh: 12.0, estrogen: 410, pdg: null },
  { day: "D-1", lh: 80.0, estrogen: 350, pdg: 4.1 },
  { day: "D0",  lh: 60.0, estrogen: 210, pdg: 9.0 },
];

// 3) 예측 근거 / 신호 기여도 (Prediction Detail — SHAP 개념 막대)
export const mockContributions = [
  { signal: "HRV(rmssd) 감소",   feature: "rmssd",               weight: 0.34, direction: "up" },
  { signal: "야간 피부온도 상승", feature: "nightly_temperature", weight: 0.27, direction: "up" },
  { signal: "안정시 심박 상승",   feature: "resting_heart_rate",  weight: 0.18, direction: "up" },
  { signal: "수면 점수 저하",     feature: "overall_score",       weight: 0.12, direction: "down" },
  { signal: "활동량 변화",        feature: "steps",               weight: 0.09, direction: "down" },
];

// 4) 오늘의 생체신호 요약 (Home — 뱃지/미니차트). baseline = 개인 평소값
export const mockVitals = {
  rmssd:             { value: 42,   baseline: 55,   unit: "ms" },
  nightly_temp:      { value: 36.8, baseline: 36.4, unit: "°C" },
  resting_hr:        { value: 68,   baseline: 61,   unit: "bpm" },
  sleep_score:       { value: 72,   baseline: 80,   unit: "" },
  glucose_mean:      { value: 98,   baseline: 92,   unit: "mg/dL" },  // 일부 참가자만 있음
};

// 5) 다음 이벤트 예측 (Prediction Detail)
export const mockNextEvents = {
  lh_surge_expected: "D-1 ~ D0",
  fertility_window_prob: 0.81,     // 0~1
};

// 6) 주기 달력 (Calendar — 날짜별 예측 phase)
export const mockCalendar = {
  month: "2026-08",
  days: [
    { date: "2026-08-05", phase: "Menstrual" },
    { date: "2026-08-11", phase: "Follicular" },
    { date: "2026-08-19", phase: "Fertility" },
    { date: "2026-08-25", phase: "Luteal" },
    // ... 한 달치 적당히 채우기 (phase는 위 4개 중 하나)
  ],
  next_period_estimate: "2026-09-03",
};
```

### 교체 지점 격리 (계약 기반 원칙 유지)
화면 컴포넌트는 mock을 직접 import하지 말고 아래 함수를 통해서만 받는다.
(나중에 이 함수 본문만 실제 호출로 교체 -> 화면 코드 안 건드림)

```js
// src/api/index.js  <- 나중에 여기만 실제 모델 호출로 교체
import * as mock from "./mockData";

export const getPredictionSummary = async () => mock.mockPredictionSummary;
export const getHormoneSeries    = async () => mock.mockHormoneSeries;
export const getContributions    = async () => mock.mockContributions;
export const getVitals           = async () => mock.mockVitals;
export const getNextEvents       = async () => mock.mockNextEvents;
export const getCalendar         = async () => mock.mockCalendar;
```

---

## 5. 디바이스 탭 구조 (PC / 모바일 / 워치)

**하나의 대시보드를 세 디바이스 프레임으로 미리보기**하는 구조. (앱 3개를 만드는 게 아님)

- 상단/사이드에 탭 `[ PC ] [ 모바일 ] [ 워치 ]`. `useState`로 현재 device 관리.
- 디바이스별 프레임 컴포넌트(`<PCFrame>`, `<MobileFrame>`, `<WatchFrame>`) 안에 같은 데이터를 다른 레이아웃으로 렌더링.
- 프레임은 CSS 목업(폰 베젤 / 워치 원형·둥근사각 / 넓은 브라우저 창)만.

### 디바이스별 정보 밀도 (이 원칙대로)
- **PC:** 밀도 높게. 예측요약 + 호르몬곡선 + 기여도 + 달력을 한 화면 그리드에.
- **모바일:** 세로 스크롤, 카드 1열. 레퍼런스 폰 앱 느낌(원형 게이지 + 하단 탭바)에 가장 근접.
- **워치:** 극단 축약 — **핵심 하나만**(현재 phase + 다음 이벤트 D-day + confidence). 작은 원형 게이지 수준. 나머지 생략.

---

## 6. 디자인 톤 (레퍼런스에서 색·무드만)

- 파스텔 + 부드러운 그라데이션(핑크·코랄·라벤더·소프트블루), 둥근 모서리(rounded-2xl), 넉넉한 여백, 카드 기반.
- 원형 게이지/도넛으로 "예측" 강조. 밝은 배경, 은은한 그림자.
- **색만 참고, 생리 트래킹 기능은 안 베낀다. 우리는 예측 대시보드.**

phase별 색 팔레트 예시(자유 조정):
- `Menstrual`: 로즈/레드 · `Follicular`: 민트/그린 · `Fertility`: 코랄/핑크(강조) · `Luteal`: 라벤더/퍼플

---

## 7. 폴더 구조 (제안)

```
src/
  api/
    mockData.js       # 4번 계약 (단일 소스)
    index.js          # 교체 지점
  components/
    devices/   PCFrame.jsx  MobileFrame.jsx  WatchFrame.jsx
    cards/     PredictionSummaryCard.jsx  HormoneChart.jsx  ContributionBars.jsx  VitalsSummary.jsx  CycleCalendar.jsx
  pages/       Home.jsx  PredictionDetail.jsx  Calendar.jsx
  App.jsx      # 디바이스 탭 + 라우팅
  main.jsx
```

---

## 8. 작업 순서

1. Tailwind 세팅 + phase 4색 팔레트.
2. `src/api/mockData.js` + `index.js` 먼저. (계약 최우선)
3. 디바이스 프레임 3종 껍데기.
4. 카드: 예측요약 -> 호르몬곡선 -> 기여도 -> 생체신호 -> 달력.
5. `App.jsx` 디바이스 탭 + 라우팅.
6. 세 디바이스 확인 -> `npm run build` -> `npm run preview`.

---

## 9. 미정/주의 (막히면 이 기준)

- **req/resp 계약 미확정.** 4번은 "제안 초안"이다. 애매하면 합리적으로 가정하고 `// TODO: 백엔드 확정 후 조정` 주석.
- **주기 phase 라벨은 `Menstrual/Follicular/Fertility/Luteal` 4개 고정.** 다른 라벨 금지.
- **`pdg`는 결측 많음.** null 허용, "예측 불확실/데이터 부족" 상태를 UI가 표현할 것.
- **confidence는 모델이 함께 반환한다고 "가정".** 실제 반환 안 하면 나중에 제거될 수 있음 -> 주석.
- 로그인/실시간 없음. 애매하면 "예쁘고 단순하게".
