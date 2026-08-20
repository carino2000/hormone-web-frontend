# FRONTEND_SPEC.md — 호르몬 예측 대시보드 프론트엔드 작업 지시서

> 이 문서는 Claude Code에게 넘기는 프론트엔드 작업 지시서다.
> 프로젝트: 식스레터스 PoC — mcPHASES 기반 여성호르몬 예측 대시보드
> 이 문서를 먼저 끝까지 읽고, "0. 절대 규칙"을 어기지 말 것.

---

## 0. 절대 규칙 (가장 중요 — 위반 금지)

1. **언어는 JavaScript (JSX)로 작성한다. TypeScript 아님.**
   - 만약 프로젝트가 TS로 생성됐어도 `.jsx`로 작업한다. `.tsx`/`.ts` 새로 만들지 말 것.
2. **모든 데이터는 mock(가짜)이다. 실제 API 호출 코드를 넣지 마라.**
   - 백엔드는 아직 없다. 정해진 req/resp 계약도 아직 없다.
   - 대신 아래 "4. Mock 데이터 계약"에 정의된 형태를 **단일 소스(one source of truth)**로 삼아, 모든 화면이 그 mock을 통해서만 데이터를 받게 한다.
   - `fetch`, `axios` 등 네트워크 호출 금지. 나중에 이 mock 자리에 실제 호출을 끼울 수 있도록 **교체 지점을 한 곳(`src/api/`)에 격리**한다.
3. **이 앱은 "예측 대시보드"다. 생리주기 트래킹 앱이 아니다.**
   - 레퍼런스 이미지(생리 트래킹 앱)는 **색감·톤·레이아웃 감각만** 참고한다. 기능을 그대로 베끼지 않는다.
   - 우리의 핵심은 "웨어러블 신호로 호르몬/배란을 **예측**하고, 그 **근거**를 보여주는 것"이다.
4. **로그인/회원가입/인증 없음.** PoC 데모라 불필요. 만들지 마라.
5. 각 화면의 세부 디자인은 자유롭게 예쁘게. 단 아래 "3. 화면 구성"의 큰 틀과 "5. 디바이스 탭 구조"는 반드시 지킨다.

---

## 1. 프로젝트 배경 (왜 이걸 만드는가)

- 스마트워치(Fitbit류) 생체신호로 **여성 호르몬 수치와 배란/주기를 예측**하는 AI PoC의 프론트엔드다.
- 예측 모델·에이전트(파이썬)는 **다른 팀원이** 만든다. 이 프론트는 그 결과를 **받아서 보여주는** 역할이다.
- 지금은 그 모델의 출력 형식이 확정되지 않았다. 그래서 **우리가 먼저 가정한 mock 계약으로 UI를 만들고**, 나중에 실제 형식이 정해지면 mock만 교체한다. (UI가 계약을 끌어내는 역할)
- **이번 PoC 범위:** 저장된 데이터 기반의 예측 결과를 "시각적으로 완성도 있게" 보여주는 데모. 실시간 스트리밍은 범위 밖(다음 단계).

### 도메인 최소 지식 (UI에 쓰이는 용어)
- **호르몬 3종:** `LH`(황체형성호르몬, 배란 직전 급상승), `E3G`(에스트로겐 대사물, 배란 다가올수록 상승), `PdG`(프로게스테론 대사물, 배란 후 상승).
- **주기 4단계(phase):** `menstruation`(월경) → `follicular`(난포기) → `ovulation`(배란) → `luteal`(황체기).
- **웨어러블 신호:** `HR`(심박), `HRV`(심박변이도), `skin_temp`(피부온도), `sleep`, `activity`, `respiration`.
- **예측 근거(설명가능성):** 어떤 신호가 예측에 얼마나 기여했는지(SHAP 개념). UI에선 "기여도 막대"로 표현.

---

## 2. 기술 스택 & 세팅

- **Vite + React (JavaScript)**
- 스타일: **Tailwind CSS** 권장 (없으면 CSS 모듈도 허용). 아이콘은 `lucide-react`.
- 차트: `recharts` (호르몬 곡선·기여도 막대·주기 도넛에 사용).
- 상태: 로컬 컴포넌트 상태(`useState`)로 충분. 전역 상태관리 라이브러리 도입 금지(과함).
- 페이지가 여러 개면 `react-router-dom` 사용. (아래 3번 참고)
- 실행: `npm run dev`(개발), `npm run build` → `npm run preview`(최종 확인).

---

## 3. 화면 구성 (큰 틀만 — 세부는 자유)

PoC라 화면은 최소로. 아래 3개 페이지 + 공용 디바이스 탭.

### 3-1. Home / 예측 요약 (메인)
가장 중요한 화면. "지금 상태 한눈에".
- **오늘의 예측 카드:** 현재 주기 단계(phase) + 배란까지 D-day + 예측 확신도(confidence %).
  - 레퍼런스의 원형 게이지 느낌 차용 가능(예: "Ovulation in 7 days" 스타일).
- **자연어 요약:** 모델이 준 설명 문장(mock의 `summary_text`)을 말풍선/배너로.
- **핵심 생체신호 요약:** HRV·피부온도 등 오늘 값 + "평소 대비" 표시(간단한 미니 차트/뱃지).

### 3-2. Prediction Detail / 예측 상세
"왜 이렇게 예측했나"를 보여주는 화면. **우리 프로젝트의 차별점.**
- **호르몬 곡선:** 최근 N일간 LH/E3G/PdG 추정치 라인 차트(recharts).
- **예측 근거(기여도):** 어떤 신호가 예측에 얼마나 기여했는지 가로 막대(SHAP 개념). 예: "HRV 감소 ▉▉▉▉ / 피부온도 상승 ▉▉".
- **다음 이벤트 예측:** LH surge 예상 시점, 배란 윈도우 확률 등.

### 3-3. Calendar / 주기 달력
- 월 단위 달력. 각 날짜에 예측된 주기 단계를 색으로 표시(월경/배란/가임기 등).
- 레퍼런스 이미지의 달력 색 구분(Period / Predicted / Fertile Window) 톤 참고.
- 하단에 "다음 월경 예상: OO월 OO일경" 같은 요약 배너.

> 페이지 전환은 하단 탭바 또는 사이드 내비게이션으로. (디자인 자유)

---

## 4. Mock 데이터 계약 (⚠️ 단일 소스 — 모든 화면이 이걸로만 그린다)

아래 형태를 `src/api/mockData.js`에 정의하고, 화면은 반드시 이 구조를 통해 데이터를 받는다.
**이 구조가 곧 "우리가 백엔드에 제안할 계약 초안"이다.** 실제 형식이 오면 여기만 교체한다.
값은 예시이며 자유롭게 그럴듯하게 채워도 된다. **필드 이름·구조는 유지.**

```js
// src/api/mockData.js

// 1) 오늘의 예측 요약 (Home 화면)
export const mockPredictionSummary = {
  date: "2026-08-19",
  phase: "ovulation",            // menstruation | follicular | ovulation | luteal
  phase_label_ko: "배란기",       // 화면 표시용 한글
  confidence: 0.78,              // 0~1, 예측 확신도
  days_to_ovulation: 2,          // 배란까지 D-day (음수면 이미 지남)
  summary_text: "배란 가능성이 높은 시기로 보여요. 최근 HRV가 평소보다 낮아지고 피부온도가 오른 게 근거예요.",
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
  { day: "D0",  LH: 60, E3G: 70, PdG: 14 },
];

// 3) 예측 근거 / 신호 기여도 (Prediction Detail — 막대)
export const mockContributions = [
  { signal: "HRV 감소", label: "HRV", weight: 0.34, direction: "up" },   // weight: 기여도 0~1
  { signal: "피부온도 상승", label: "Skin Temp", weight: 0.27, direction: "up" },
  { signal: "안정시 심박 상승", label: "Resting HR", weight: 0.18, direction: "up" },
  { signal: "수면 질 저하", label: "Sleep", weight: 0.12, direction: "down" },
  { signal: "활동량 변화", label: "Activity", weight: 0.09, direction: "down" },
];

// 4) 오늘의 생체신호 요약 (Home — 뱃지/미니차트)
export const mockVitals = {
  hrv: { value: 42, baseline: 55, unit: "ms" },       // baseline = 개인 평소값
  skin_temp: { value: 36.8, baseline: 36.4, unit: "°C" },
  resting_hr: { value: 68, baseline: 61, unit: "bpm" },
  sleep_score: { value: 72, baseline: 80, unit: "" },
};

// 5) 다음 이벤트 예측 (Prediction Detail)
export const mockNextEvents = {
  lh_surge_expected: "D-1 ~ D0",
  ovulation_window_prob: 0.81,   // 0~1
};

// 6) 주기 달력 (Calendar — 날짜별 예측 단계)
export const mockCalendar = {
  month: "2026-08",
  // date: phase. UI는 phase별 색으로 렌더링
  days: [
    { date: "2026-08-10", phase: "menstruation" },
    { date: "2026-08-15", phase: "follicular" },
    { date: "2026-08-19", phase: "ovulation" },
    { date: "2026-08-25", phase: "luteal" },
    // ... 한 달치 적당히 채우기
  ],
  next_period_estimate: "2026-09-06",
};
```

> **교체 지점 격리:** 화면 컴포넌트는 위 export를 직접 import하지 말고,
> `src/api/index.js`에서 `getPredictionSummary()`, `getHormoneSeries()` 같은 **함수로 감싸서** 내보낸다.
> (지금은 mock을 return, 나중에 이 함수 본문만 실제 fetch로 교체 → 화면 코드는 안 건드림)

```js
// src/api/index.js  (교체 지점 — 나중에 여기만 실제 호출로 바꾼다)
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

**하나의 대시보드를 세 디바이스 프레임으로 미리보기**하는 구조다. (실제 앱 3개를 만드는 게 아니다.)

- 화면 상단(또는 사이드)에 탭: `[ PC ] [ 모바일 ] [ 워치 ]`
- 탭을 누르면, **같은 데이터**를 그 디바이스 프레임/레이아웃으로 렌더링해 보여준다.
- 구현 힌트:
  - `useState`로 현재 선택된 device(`'pc' | 'mobile' | 'watch'`)를 관리.
  - 디바이스별 **프레임 컴포넌트**(`<PCFrame>`, `<MobileFrame>`, `<WatchFrame>`)를 만들고, 그 안에 콘텐츠를 넣는다.
  - 프레임은 CSS로 목업 느낌(모바일=폰 베젤, 워치=둥근 사각/원형, PC=넓은 브라우저 창)만 주면 충분.

### 디바이스별 콘텐츠 밀도 (중요 — 각자 알아서 예쁘게, 단 밀도는 이 원칙대로)
- **PC:** 정보 밀도 높게. 여러 카드(예측 요약 + 호르몬 곡선 + 기여도 + 달력)를 **한 화면 그리드**에 배치. 대시보드다운 레이아웃.
- **모바일:** 세로 스크롤. 카드 1열로. 레퍼런스 이미지의 폰 앱 느낌(원형 게이지, 하단 탭바)에 가장 가깝게.
- **워치:** 극단적으로 축약. **단 하나의 핵심만** — 예: 현재 phase + 배란 D-day + confidence. 나머지는 생략. 작은 원형 게이지 하나 수준.

---

## 6. 디자인 톤 (레퍼런스에서 가져올 것)

레퍼런스 이미지(생리 트래킹 앱)에서 **색감/무드만** 차용:
- **파스텔 계열 + 부드러운 그라데이션.** 핑크·코랄·라벤더·소프트블루.
- 둥근 모서리(rounded-2xl 수준), 넉넉한 여백, 카드 기반 레이아웃.
- 원형 게이지/도넛 차트로 "예측"을 시각적으로 강조.
- 밝고 깨끗한 배경(화이트/오프화이트), 그림자 은은하게.
- **주의:** 색만 참고하고, 이미지의 "생리 트래킹 기능"을 그대로 베끼지 말 것. 우리는 예측 대시보드다.

phase별 색 팔레트 예시(자유 조정 가능):
- menstruation: 로즈/레드 계열
- follicular: 소프트 그린/민트
- ovulation: 코랄/핑크(강조)
- luteal: 라벤더/퍼플

---

## 7. 폴더 구조 (제안 — 이대로 잡으면 깔끔)

```
src/
  api/
    mockData.js       # 4번의 mock 계약 (단일 소스)
    index.js          # 교체 지점 (mock을 함수로 감쌈)
  components/
    devices/
      PCFrame.jsx
      MobileFrame.jsx
      WatchFrame.jsx
    cards/
      PredictionSummaryCard.jsx
      HormoneChart.jsx
      ContributionBars.jsx
      VitalsSummary.jsx
      CycleCalendar.jsx
  pages/
    Home.jsx
    PredictionDetail.jsx
    Calendar.jsx
  App.jsx             # 디바이스 탭 + 라우팅
  main.jsx
```

---

## 8. 작업 순서 (권장)

1. Tailwind 세팅 + phase 색 팔레트 정의.
2. `src/api/mockData.js` + `src/api/index.js` 먼저 만든다. (계약이 최우선)
3. 디바이스 프레임 3종(`PCFrame/MobileFrame/WatchFrame`) 껍데기.
4. 카드 컴포넌트들(예측요약 → 호르몬차트 → 기여도 → 달력) 순서로.
5. `App.jsx`에서 디바이스 탭 + 페이지 라우팅 연결.
6. 세 디바이스에서 다 그럴듯하게 보이는지 확인 → `npm run build` → `npm run preview`.

---

## 9. 확인/미정 사항 (작업하며 막히면 이 기준으로)

- **req/resp 계약은 미확정이다.** 4번 mock 구조는 "제안 초안"이므로, 필드가 애매하면 **합리적으로 가정하고 진행**하되, 가정한 부분은 주석으로 남긴다. (`// TODO: 백엔드 확정 후 조정`)
- **로그인/유저 관리 없음.** 단일 가상 사용자 기준.
- **실시간/스트리밍 없음.** 정적 mock 스냅샷 기준.
- 애매하면 "예쁘고 단순하게" 쪽으로 결정한다. PoC 데모라 완성도>기능 개수.
```
