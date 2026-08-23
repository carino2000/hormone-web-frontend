# 데모 시뮬레이터 구현 정리

> `../demo-simulator-prompt.md` 지시서를 기준으로 구현한 내용을 정리한 문서.
> 다른 세션(Claude Code)이 검증할 수 있도록 파일 단위로 무엇을 왜 바꿨는지 남긴다.
> 커밋은 아직 하지 않았다 — `git status`로 변경분만 존재.

---

## 0. 무엇을 만들었나 (한 줄 요약)

디바이스 프레임(PC/모바일/워치) **바깥**에 "하루 넘기기" 데모 컨트롤 바를 붙이고,
Home/예측상세/달력 화면이 그 시뮬레이션 일차(`currentDay`, 1~30)를 따라가도록 데이터
계층을 새로 짰다. 목적은 발표 중 3분 안에 "베이스라인 20일 수집 → Day 20 첫 예측 →
호르몬 곡선이 자라남" 메커니즘을 보여주는 것.

---

## 1. 새로 만든 파일

| 경로 | 역할 |
|---|---|
| `src/state/simulationStore.js` | zustand 전역 상태. `currentDay/totalDays/isPlaying/speed/dataSource` + `next/prev/jumpTo/reset/play/pause/togglePlay`. 탭·디바이스 전환에도 유지되는 **유일한 진실의 원천**. |
| `src/state/useSimulationAutoplay.js` | 자동재생 타이머 훅. `App.jsx`에서 한 번만 마운트. `isPlaying && speed`에 따라 `setInterval(next, STEP_MS/speed)`. |
| `src/data/simulationSource.js` | 데이터 접근 단일 관문. `simulationDays.json`을 이 파일만 import한다. `dataSource:'api'`면 명시적으로 에러를 던진다(아직 미구현 — 오프라인 우선 원칙). |
| `src/mocks/simulationDays.json` | 30일치 픽스처(아래 3번 참고). 생성 스크립트로 만들었고 스크립트 자체는 커밋 안 함(결과 JSON만). |
| `src/components/simulator/SimulatorBar.jsx` | 데모 컨트롤 바 본체. DEMO 배지, `Day N · 날짜 · N/30`, 하루 넘기기(주 버튼)/이전 날/재생·일시정지/속도(1x·2x·4x)/초기화/스크러버(Day 20 눈금). |
| `src/components/cards/ColdStartCard.jsx` | Day 1~19 콜드스타트 화면. "수집 중 N/20일" + 진행바 + 오늘 수집된 신호 미리보기. `compact` prop으로 워치용 축약. |
| `src/lib/useCountUp.js` | framer-motion `animate()` 기반 카운트업 훅. `disabled`면 즉시 반영(애니메이션 생략). |
| `src/lib/useChangeFlash.js` | 값이 바뀐 순간 짧게 `true`를 반환하는 훅(카드 하이라이트용). 렌더 중 상태 조정 패턴 사용(아래 5번 참고). |
| `src/lib/formatDate.js` | `"2026-09-03"` → `"2026년 9월 3일"` 등 날짜 포맷 헬퍼. |

## 2. 수정한 파일과 변경 이유

| 경로 | 무엇이 바뀌었나 |
|---|---|
| `src/App.jsx` | `useSimulationAutoplay()` 마운트, `<SimulatorBar device={device} />`를 `<Routes>` 바로 다음에 배치(PC는 프레임 아래 인라인 블록, 모바일/워치는 `fixed` 오버레이로 화면 하단). 모바일/워치 `main`에 `pb-40` 추가(플로팅 바에 콘텐츠 가려짐 방지). |
| `src/api/index.js` | 전면 재작성. 기존 정적 mock 대신 `simulationSource`에서 `day`를 받아 뷰모델을 만든다. `getPredictionSummary/getVitals/getHormoneSeries/getContributions/getNextEvents/getCalendar` 모두 `(day, dataSource)` 시그니처로 변경. `isColdStartDay(day)`, `COLD_START_DAYS` re-export 추가. |
| `src/api/mockData.js` | **삭제**. `simulationDays.json` + `simulationSource.js`가 그 역할을 대체함(단일 소스 원칙 유지). |
| `src/pages/Home.jsx` | `useSimulationStore`에서 `currentDay/dataSource` 구독, day 바뀔 때마다 refetch. `isColdStartDay(currentDay)`면 `ColdStartCard`, 아니면 기존 `PredictionSummaryCard`+`VitalsSummary`. `fastForward`(자동재생 4배속) 플래그를 하위 카드에 전달해 애니메이션 억제. |
| `src/pages/PredictionDetail.jsx` | 동일 패턴. 콜드스타트면 `ColdStartCard`(PC에서는 `max-w-xl`로 폭 제한), 아니면 `HormoneChart`+`ContributionBars`+다음 이벤트 카드. "다음 이벤트" 카드 내용을 `nextEvent.label/daysTo` + `nextPeriod` 기반으로 재구성(예전 `fertility_window_prob` 필드는 폐기). |
| `src/pages/Calendar.jsx` | `getDaySnapshot`으로 현재 날짜 문자열을 구해 `CycleCalendar`에 `currentDay/currentDate/coldStartDays`로 전달. |
| `src/components/cards/CycleCalendar.jsx` | `calendar.month` 단일 월 가정을 버리고 `calendar.days`(날짜별 `status`)를 직접 순회하도록 변경. 초기 `cursor`를 `currentDate`의 월로 설정. `hasPredictionData` 판정을 "이 달에 future가 아닌 날이 하나라도 있는가"로 변경. "수집 중" 범례 칩 추가. `next_period_estimate`가 없으면(콜드스타트) 수집 진행 배너로 대체. |
| `src/components/calendar/MonthGrid.jsx` | `statusByDate` prop 추가. `collecting` 상태는 점선 스카이블루 원, `predicted`는 기존 phase 색상, 나머지는 기존 중립 스타일. |
| `src/components/cards/PredictionSummaryCard.jsx` | `confidence`/`days_to_next_event`에 `useCountUp` 적용. `phase`가 바뀐 순간 `useChangeFlash`로 카드 전체를 살짝 펄스 + "단계 전환" 배지 노출. |
| `src/components/cards/VitalsSummary.jsx` | 필드 키를 실데이터 명(`rmssd/nightly_temperature/resting_heart_rate/overall_score/glucose_mean/steps`)으로 통일(라벨은 `api/index.js`의 `VITALS_LABEL_KO`에서). `steps` 타일 추가. 값이 `null`(결측)이면 "측정 안 됨" 표시(0 표시 금지 원칙 준수). 값 바뀌면 `useChangeFlash`로 타일 배경 하이라이트. |
| `src/components/cards/HormoneChart.jsx` | X축을 `currentDay`가 아니라 **전체 30일 고정 도메인**으로 변경(매 렌더 축이 재스케일되면 "자라나는" 느낌이 아니라 흔들리는 느낌이 남). `ReferenceLine x={20}` "예측 시작" 라벨 추가. 각 라인에 작은 `dot` 추가(Day 20 첫 점처럼 데이터가 1개뿐일 때도 보이게). `fastForward`면 `isAnimationActive=false`. |
| `src/components/cards/ContributionBars.jsx` | 막대 너비에 `transition-[width]` 추가(값 바뀔 때 부드럽게 자람). `fastForward`면 트랜지션 생략. |

---

## 3. 픽스처 데이터 설계 (`src/mocks/simulationDays.json`)

- **Day 1 = 2026-08-13**, Day 30 = 2026-09-11 (30일 연속).
- `coldStartDays: 20` — Day 1~19는 콜드스타트, Day 20부터 예측 노출.
- 한 사이클이 자연스럽게 닫히는 스토리:
  - Day 1~5 월경(Menstrual) → Day 6~13 난포기(Follicular) → Day 14~21 가임기(Fertility,
    LH 서지는 Day 19 피크·Day 20에 "막 지난" 상태로 리빌) → Day 22~28 황체기(Luteal) →
    Day 29~30 다음 월경 시작(Menstrual) — `nextPeriod.date`가 정확히 Day 29(2026-09-10)와
    맞아떨어진다.
- 값 범위는 `FRONTEND_SPEC.md` 4번(실데이터 기준: lh 0~186, estrogen 0~640, pdg 1~30)을 따름.
- `pdg`는 배란 전(Day 1~20)은 전부 `null`, 황체기(Day 21~30) 중 2일(23, 27)도 추가로
  `null` — 결측률 약 73%, 지시서의 "약 65%"에 근접하게 의도적으로 구성.
- 웨어러블 신호(`rmssd`, `nightly_temperature`, `resting_heart_rate`, `overall_score`,
  `glucose_mean`, `steps`)는 제어점 기반 선형보간 + 시드 고정 의사난수 노이즈로 생성
  (재현 가능, `Math.random` 미사용). BBT 패턴(배란 전 저점 → 배란 후 급등 → 황체기 유지 →
  월경 전 하강)을 반영.
- `glucose_mean`은 5일, `steps`는 2일 결측으로 "일부 참가자만 보유" 현실성을 흉내냄.
- 기여도(`contributions`)는 각 날의 웨어러블 값이 baseline에서 얼마나 벗어났는지로
  자동 계산(가중치 정규화, 상위 4개). Day 20~30(실제 화면에 노출되는 구간)에서는
  HRV/체온/수면 중심으로 나오는 것을 확인함 — steps가 가끔 1위로 나오는 날도 있으나
  전체 서사에 방해되지 않는 수준.
- `summaryText`는 Day 20/21/29/30에 하드코딩된 문구(리빌·LH서지·월경 시작 등 핵심
  순간), 나머지는 phase별 템플릿 + 최상위 기여 신호를 조합해 생성.

생성 스크립트는 세션 스크래치패드에만 존재하고 저장소에는 커밋하지 않았다(결과 JSON만
포함). 데이터를 다시 튜닝하고 싶다면 이 문서의 로직을 참고해 새 스크립트를 짜야 한다.

---

## 4. 상태/데이터 흐름

```
SimulatorBar / 자동재생 훅
        │  next()/prev()/jumpTo()/reset()/play()/pause()
        ▼
simulationStore (zustand, 전역)
        │  currentDay, dataSource, speed, isPlaying
        ▼
pages/Home.jsx, PredictionDetail.jsx, Calendar.jsx
        │  useEffect(day, dataSource 변경 시 refetch)
        ▼
api/index.js  (뷰모델 조립 — 유일한 교체 지점)
        │
        ▼
data/simulationSource.js  (유일한 데이터 접근 관문)
        │
        ▼
mocks/simulationDays.json
```

- 화면 컴포넌트는 `api/index.js`만 호출한다. `simulationSource`나 JSON을 직접
  import하지 않는다(지시서의 "데이터 접근은 반드시 한 곳을 거치게" 원칙).
- `dataSource`를 `'api'`로 바꾸면 `simulationSource.js`의 `assertMockSource`가
  즉시 에러를 던진다 — 실제 백엔드 연동 시 이 파일의 mock 분기만 fetch 호출로
  교체하면 되는 구조.

---

## 5. React 관련 디테일 (검증 시 참고)

- `useCountUp`/`useChangeFlash`/`SimulatorBar`의 Day-20 리빌 배지는 모두
  **"effect 안에서 동기적으로 setState" 린트 규칙**(`react-hooks/set-state-in-effect`)을
  피하려고, prop이 바뀐 순간 반응해야 하는 부분은 **렌더링 중 상태 조정**(`if (x !== prev) { setPrev(x); setState(...) }`
  패턴, 이 저장소의 `DiaryPanel.jsx`/`CycleCalendar.jsx`가 이미 쓰던 관례)으로 처리하고,
  실제 비동기 타이머(몇 ms 뒤 원복)만 `useEffect`에 남겼다. `npm run lint` 통과 확인함.
- `useCountUp`은 항상 숫자만 받는다고 가정(현재 모든 호출부가 숫자 또는 baseline
  숫자를 넘김) — `typeof value !== 'number'` 방어 코드는 실제로 쓰이지 않아 제거했다.

---

## 6. 확인한 것 (Playwright로 직접 조작, 헤드리스 크로미움)

- Day 1 콜드스타트 카드 노출, DEMO 배지/컨트롤 바가 프레임 바깥에 위치.
- 하루 넘기기 5회 클릭 → `Day 6`으로 정확히 이동.
- 스크러버로 Day 20 점프 → 콜드스타트 → 예측 화면 전환, "단계 전환" 배지,
  컨트롤 바의 "베이스라인 20일 수집 완료" 리빌 배너 노출.
- 예측상세 탭: Day 20에 첫 점 노출(고정 X축 1~30, `ReferenceLine` 라벨 안 잘림),
  Day 23/30까지 넘기며 곡선이 오른쪽으로 자라나는 것 확인. Day 30에서 LH 서지
  스파이크·PdG 점선 정상 렌더.
  - **1차 검증에서 버그 발견 → 수정함**: X축 domain을 `currentDay`까지로 동적으로
    잡았더니 Day 20 시점에 `ReferenceLine`이 그래프 우측 끝에 겹쳐 라벨이 잘리고,
    단일 데이터포인트(Day 20)가 `dot=false`라 아예 안 보이는 문제가 있었다.
    domain을 전체 30일 고정 + 각 라인에 작은 dot을 추가해 해결.
- 달력 탭: Day 23 기준 9월 1~4일만 phase 색상, 5일 이후는 표시 안 됨(스포일러 방지),
  "수집 중" 범례, "다음 월경 예상" 배너 정상.
- 콜드스타트 상태의 달력(Day 9): 8/13~8/21만 점선 "수집 중" 원, 배너가
  "베이스라인 데이터 수집 중 · 9/20일"로 정상 대체.
- 모바일/워치 디바이스 전환 시 컨트롤 바가 화면 하단에 fixed로 뜨고 일차 유지.
- 라이트/다크 테마 전환 시 컨트롤 바는 항상 짙은 크롬 톤 유지(제품 UI와 시각적 구분).
- 초기화 → Day 1 복귀. 자동재생(1x) 3초 → 대략 4일 진행(800ms/스텝과 일치).
  자동재생(4x) 2.5초 → Day 13까지 진행(200ms/스텝과 일치), 마지막 날(Day 30)
  도달 시 "하루 넘기기"/재생 버튼 자동 비활성화(재감기 없음, 지시서 원칙 준수).
  이전 날/초기화 버튼 별도 격리 테스트로 재확인(레이스 컨디션 없는 정상 동작).
- `console --errors` 전 시나리오에서 빈 배열(에러 없음).
- `npm run lint`, `npm run build` 모두 통과.

## 7. 지시서 완료 조건 대조

- [x] Day 1에서 시작, 하루 넘기기로 30일까지 진행 가능
- [x] 자동 재생으로 Day 1 → 30 무인 진행, 마지막에 정지
- [x] Day 19 → 20 전환 시 수집 중 화면이 예측 화면으로 바뀜
- [x] 탭(홈/예측상세/달력)을 옮겨도 일차 유지 (zustand 전역 상태, 로컬 state 아님)
- [x] 디바이스 뷰(PC/모바일/워치)를 바꿔도 일차 유지
- [x] 초기화로 Day 1 복귀
- [x] 백엔드 없이 동작 (`dataSource` 기본값 `'mock'`, `'api'`는 명시적 미구현 에러)

## 8. 알려진 제한사항 / 후속 검토 포인트

- **새 의존성**: `zustand`, `framer-motion` 추가함(사용자가 명시적으로 선택).
  `package.json`/`package-lock.json` 변경분 확인 필요.
- **생성 스크립트 미커밋**: `simulationDays.json`은 결과물만 존재. 데이터를 다시
  튜닝하려면 이 문서 3번의 로직을 참고해 스크립트를 새로 작성해야 함.
- **"오늘" 버튼**: `CycleCalendar`의 기존 "오늘" 버튼(달력 좌상단)은 실제
  기기의 오늘 날짜(`new Date()`)로 이동하는 기존 기능을 그대로 뒀다. 시뮬레이션의
  가상 "오늘"(`currentDay`)과는 무관 — 혼동 소지가 있으면 후속 논의 필요.
- **번들 크기**: `vite build`에서 단일 청크 798KB(gzip 240KB) 경고. 코드 스플리팅은
  하지 않음(포트폴리오 데모 규모에서는 불필요하다고 판단).
- **커밋 여부**: 아직 커밋하지 않음. `git status` 기준 수정/삭제/신규 파일 목록은
  위 1~2번 표와 일치해야 한다.
