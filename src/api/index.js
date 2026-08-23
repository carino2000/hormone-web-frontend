// src/api/index.js — 교체 지점. 화면 컴포넌트는
// simulationSource.js 를 직접 건드리지 않고 반드시 이 함수들을 통해서만 데이터를 받는다.
//
// 데이터 소스는 백엔드 하나뿐이다 (로컬 목업 제거).
import {
  ensureLoaded,
  getAllDays,
  getBaseline,
  getColdStartDays,
  getDaySnapshot,
  getDaysUpTo,
} from "../data/simulationSource";
import { PHASE_LABELS_KO } from "../lib/phase";
import { fetchJobsByDate } from "../data/apiSource";
import {
  HOME_VITAL_KEYS,
  WEARABLE_BY_KEY,
  WEARABLE_CATALOG,
  WEARABLE_GROUPS,
  toDisplayValue,
} from "../lib/wearableCatalog";



export const isColdStartDay = (day, coldStartDays) => day < coldStartDays;

// 라벨·단위·소수자리는 전부 lib/wearableCatalog.js 가 갖는다.
// 예전에는 여기 6개가 하드코딩돼 있었고 data/apiSource.js 에도 같은 6개가
// 따로 박혀 있어서 둘이 어긋나기 쉬웠다. 이제 출처는 카탈로그 하나다.
export const VITALS_LABEL_KO = Object.fromEntries(
  WEARABLE_CATALOG.map((f) => [f.key, f.label]),
);

export const VITALS_DECIMALS = Object.fromEntries(
  WEARABLE_CATALOG.map((f) => [f.key, f.decimals]),
);

/**
 * Day 0 = 아직 하룻밤도 지나지 않은 시작 시점.
 *
 * 수면·야간 피부온도·HRV 는 밤이 지나야 확정되는 값이라, 진입 즉시 오늘치 값이
 * 있으면 시간상 앞뒤가 안 맞는다. 그래서 Day 0 에서는 모든 값을 비워 두고
 * "하루 넘기기"를 눌러야 Day 1 데이터가 들어오게 한다.
 */
export const isBeforeStart = (day) => !day || day < 1;

/**
 * 예측 진행 상태. 화면 분기의 단일 기준이다.
 *
 * ★ 예전에는 화면마다 `!prediction` 하나로 "콜드스타트인가"를 판단했는데, 그러면
 *   **"아직 한 번도 예측이 없다"와 "오늘 것이 아직 안 왔다"가 같은 취급**을 받는다.
 *   백엔드 advance 는 202 를 즉시 주고 예측은 비동기로 돌리므로(DemoService 주석 참고),
 *   하루 넘기기 직후에는 항상 후자 상태를 거친다. 그래서 Day 26 에서 하루를 넘기면
 *   26일치 예측을 이미 갖고 있는데도 화면이 "데이터 수집 중"으로 돌아갔다가 왔다.
 *   Mock 은 순식간이라 깜빡임 정도지만, 파이썬 모델이 붙으면 몇 초짜리가 된다.
 *
 * | state          | 뜻 | 화면 |
 * |---|---|---|
 * | `before_start` | Day 0. 하룻밤도 안 지남 | 시작 전 카드 |
 * | `collecting`   | 예측이 아직 한 번도 없음 | 콜드스타트 카드 |
 * | `pending`      | 예측 이력은 있는데 오늘 것이 아직 안 옴 | **직전 예측 유지 + 계산중 표시** |
 * | `ready`        | 오늘 예측 있음 | 정상 |
 */
export async function getPredictionStatus(day) {
  await ensureLoaded();

  if (isBeforeStart(day)) {
    return { state: "before_start", predictionDay: null, isStale: false };
  }
  if (getDaySnapshot(day)?.prediction) {
    return { state: "ready", predictionDay: day, isStale: false };
  }

  const withPrediction = getDaysUpTo(day).filter((d) => d.prediction);
  if (withPrediction.length === 0) {
    return { state: "collecting", predictionDay: null, isStale: false };
  }
  return {
    state: "pending",
    predictionDay: withPrediction[withPrediction.length - 1].day,
    isStale: true,
  };
}

/** pending 이면 직전 예측이 있는 스냅샷을, 아니면 그날 스냅샷을 준다. */
function snapshotForPrediction(day) {
  const snap = getDaySnapshot(day);
  if (snap?.prediction) return snap;
  const withPrediction = getDaysUpTo(day).filter((d) => d.prediction);
  return withPrediction.length ? withPrediction[withPrediction.length - 1] : null;
}

export async function getPredictionSummary(day) {
  await ensureLoaded();

  if (isBeforeStart(day)) {
    return {
      day: 0, date: null, phase: null,
      isColdStart: true, isBeforeStart: true, isPending: false,
    };
  }

  const snap = getDaySnapshot(day);
  if (!snap) return null;

  // 오늘 예측이 없으면 직전 예측으로 대체한다. 없으면 진짜 콜드스타트다.
  const source = snapshotForPrediction(day);
  if (!source) {
    return { day, date: snap.date, phase: null, isColdStart: true, isPending: false };
  }

  const { prediction } = source;
  const isPending = source.day !== day;

  return {
    day,
    date: snap.date,
    phase: prediction.phase,
    phase_label_ko: prediction.phaseLabelKo ?? PHASE_LABELS_KO[prediction.phase],
    confidence: prediction.confidence,
    days_to_next_event: prediction.nextEvent?.daysTo ?? null,
    next_event_label: prediction.nextEvent?.label ?? null,
    summary_text: prediction.summaryText ?? null,
    isColdStart: false,
    // ★ pending 일 때 이 값이 오늘이 아니다. 화면은 반드시 "언제 기준인지"를 밝혀야 한다 —
    //   어제 예측을 오늘 것처럼 보여주면 그건 거짓말이다.
    isPending,
    predictionDay: source.day,
    predictionDate: source.date,
  };
}

export async function getVitals(day) {
  await ensureLoaded();
  const baseline = getBaseline();

  // Day 0 은 값 없이 뼈대만 돌려준다. null 로 채워야 화면이 "측정 안 됨"으로 그린다 —
  // 카드를 통째로 숨기면 "무엇을 모으는지"가 안 보여서 콜드스타트 서사가 약해진다.
  // 홈 타일은 44개 중 HOME_VITAL_KEYS 6개만 쓴다. 44개를 다 깔면 제품 화면이
  // 아니라 계기판 덤프가 된다 — 전체 44개는 getModelInputs 가 따로 내려준다.
  //
  // ★ baseline 은 백엔드에서 "지금까지 수집된 값의 평균"으로 온다(DemoService.baselineOf).
  //   그래서 1일차에는 baseline 이 그날 값 자신이라 차이가 항상 0 이 되고, 화면이
  //   6칸 전부 "평소와 같음"이라고 말한다. 비교한 것처럼 보이지만 비교할 게 없는 상태다.
  //   관측이 MIN_BASELINE_DAYS 일 미만이면 baseline 을 아예 안 내려서 화면이 비교를 숨긴다.
  const observedDays = countObservedDays(day);

  const tile = (key, value) => [
    key,
    {
      value: toDisplayValue(key, value),
      baseline:
        (observedDays[key] ?? 0) >= MIN_BASELINE_DAYS
          ? toDisplayValue(key, baseline?.[key])
          : null,
      unit: WEARABLE_BY_KEY[key]?.unit ?? "",
    },
  ];

  if (isBeforeStart(day)) {
    return Object.fromEntries(HOME_VITAL_KEYS.map((key) => tile(key, null)));
  }

  const snap = getDaySnapshot(day);
  if (!snap) return null;

  return Object.fromEntries(HOME_VITAL_KEYS.map((key) => tile(key, snap.wearable?.[key])));
}

/** "평소"라고 부르려면 최소 이만큼은 관측돼야 한다. */
const MIN_BASELINE_DAYS = 3;

/** 홈 타일 키별로 day 까지 실제로 값이 있었던 날 수. 결측일은 안 센다. */
function countObservedDays(day) {
  const counts = {};
  for (const key of HOME_VITAL_KEYS) counts[key] = 0;
  if (isBeforeStart(day)) return counts;
  for (const d of getDaysUpTo(day)) {
    for (const key of HOME_VITAL_KEYS) {
      if (d.wearable?.[key] != null) counts[key] += 1;
    }
  }
  return counts;
}

/**
 * 모델에 실제로 들어가는 입력 전체 (P-02 확장).
 *
 * 홈 타일 6개는 "사용자가 읽는 화면"이고, 이건 "모델이 먹는 것"이다. 대표 시연에서
 * "웨어러블 몇 개나 씁니까"에 답하는 자리다. 44개를 그룹별로 묶어서 오늘 값과
 * 결측 여부를 같이 보여준다.
 *
 * ★ 결측을 숨기지 않는다. 이 참가자는 하루 44개 중 38~41개만 값이 있고
 *   glucose_mean / glucose_std / sedentary 는 90일 내내 비어 있다.
 *   비어 있는 칸을 지우면 "44개를 다 채워서 넣는다"는 잘못된 인상을 준다.
 */
export async function getModelInputs(day) {
  await ensureLoaded();
  const baseline = getBaseline();
  const snap = isBeforeStart(day) ? null : getDaySnapshot(day);
  const wearable = snap?.wearable ?? {};

  const items = WEARABLE_CATALOG.map((f) => {
    const raw = wearable[f.key];
    return {
      key: f.key,
      label: f.label,
      group: f.group,
      unit: f.unit,
      decimals: f.decimals,
      value: toDisplayValue(f.key, raw),
      baseline: toDisplayValue(f.key, baseline?.[f.key]),
      measured: raw != null,
      isHomeTile: HOME_VITAL_KEYS.includes(f.key),
    };
  });

  const measured = items.filter((i) => i.measured).length;

  return {
    day,
    date: snap?.date ?? null,
    // Day 0 은 "측정 실패"가 아니라 "아직 수집 전"이다. 둘을 구분하지 않으면
    // 화면이 "44개가 측정되지 않았어요"라고 말하는데, 시계가 고장난 것처럼 읽힌다.
    beforeStart: isBeforeStart(day),
    // 모델 입력은 47개 = 웨어러블 44 + 정적 3.
    // 정적 3개는 birthYear / ageOfFirstMenarche / ethnicity 이고
    // (엑셀 주황색 = 이미 DB 에 있는 값), 백엔드 ModelInputBuilder 가 붙인다.
    // 타임라인 응답에는 안 실려 오므로 여기서는 개수만 센다.
    wearableCount: items.length,
    staticCount: 3,
    totalCount: items.length + 3,
    measured,
    missing: items.length - measured,
    groups: WEARABLE_GROUPS.map((name) => ({
      name,
      items: items.filter((i) => i.group === name),
    })),
  };
}

// 예측 상세 탭의 누적 그래프용 — day 까지의 전체 시계열.
// 콜드스타트 구간은 모델 출력이 없으므로 null 로 비워서 차트에서 예측 시작일부터 선이 그려지게 한다.
//
// *Actual 필드는 실측 정답이다. 예측선과 겹쳐 그려서 "맞히는 모델"임을 보여준다(P-01).
export async function getHormoneSeries(day) {
  await ensureLoaded();
  return getDaysUpTo(day).map((d) => ({
    day: d.day,
    date: d.date,
    lh: d.prediction?.lh ?? null,
    estrogen: d.prediction?.estrogen ?? null,
    pdg: d.prediction?.pdg ?? null,
    lhActual: d.truth?.lh ?? null,
    estrogenActual: d.truth?.estrogen ?? null,
    pdgActual: d.truth?.pdg ?? null,
  }));
}

/**
 * 지금 화면의 예측이 무엇으로 계산됐는지 (P-03).
 * modelVersion 이 `mock-` 으로 시작하면 백엔드 내장 Mock 이다.
 */
export async function getModelInfo() {
  await ensureLoaded();
  const withPrediction = getAllDays()
    .filter((d) => d.prediction?.modelVersion)
    .pop();
  const modelVersion = withPrediction?.prediction?.modelVersion ?? null;
  return {
    modelVersion,
    isMock: modelVersion == null || modelVersion.startsWith("mock-"),
    source: "backend",
  };
}

/**
 * 전체 구간 정확도 (P-03 모델 성능 탭).
 *
 * ★ Mock 일 때의 수치는 모델 성능이 아니다. 화면에서 반드시 그렇게 표시해야 한다.
 *   Mock 은 실측에 ±8% 노이즈를 얹는 구조라 잘 맞는 게 당연하다.
 */
export async function getAccuracySummary(day) {
  await ensureLoaded();
  const days = getDaysUpTo(day).filter((d) => d.prediction && d.truth);
  if (days.length === 0) return null;

  const stat = (key) => {
    const pairs = days
      .map((d) => [d.prediction[key], d.truth[key]])
      .filter(([p, a]) => p != null && a != null);
    if (pairs.length === 0) {
      return { key, n: 0, mae: null, mape: null, corr: null };
    }
    const mae = pairs.reduce((s, [p, a]) => s + Math.abs(p - a), 0) / pairs.length;
    const withNonZero = pairs.filter(([, a]) => a !== 0);
    const mape = withNonZero.length
      ? (withNonZero.reduce((s, [p, a]) => s + Math.abs((p - a) / a), 0) / withNonZero.length) * 100
      : null;
    return { key, n: pairs.length, mae, mape, corr: pearson(pairs) };
  };

  const phasePairs = days
    .map((d) => [d.prediction.phase, d.truth.phase])
    .filter(([p, a]) => p && a);
  const phaseHits = phasePairs.filter(([p, a]) => p === a).length;

  return {
    days: days.length,
    firstDay: days[0].day,
    lastDay: days[days.length - 1].day,
    hormones: [
      { label: "LH", unit: "mIU/mL", ...stat("lh") },
      { label: "Estrogen", unit: "ng/mL", ...stat("estrogen") },
      { label: "PdG", unit: "mcg/mL", ...stat("pdg") },
    ],
    phase: {
      n: phasePairs.length,
      hits: phaseHits,
      accuracy: phasePairs.length ? (phaseHits / phasePairs.length) * 100 : null,
      // 혼동행렬: {실제: {예측: 횟수}}
      confusion: phasePairs.reduce((m, [p, a]) => {
        m[a] = m[a] ?? {};
        m[a][p] = (m[a][p] ?? 0) + 1;
        return m;
      }, {}),
    },
    scatter: days.map((d) => ({
      day: d.day,
      lh: d.prediction.lh,
      lhActual: d.truth.lh,
      estrogen: d.prediction.estrogen,
      estrogenActual: d.truth.estrogen,
      pdg: d.prediction.pdg,
      pdgActual: d.truth.pdg,
    })),
  };
}

function pearson(pairs) {
  const n = pairs.length;
  if (n < 2) return null;
  const mx = pairs.reduce((s, [p]) => s + p, 0) / n;
  const my = pairs.reduce((s, [, a]) => s + a, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [p, a] of pairs) {
    num += (p - mx) * (a - my);
    dx += (p - mx) ** 2;
    dy += (a - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? null : num / den;
}

// 웨어러블 신호 시계열 (P-02). 호르몬 곡선과 같은 X축으로 그리려고 day 를 그대로 쓴다.
// 콜드스타트 구간도 포함한다 — 예측은 없어도 신호는 계속 쌓이고 있었다는 게 요점이다.
export async function getWearableSeries(day) {
  await ensureLoaded();
  return getDaysUpTo(day).map((d) => ({
    day: d.day,
    date: d.date,
    rmssd: d.wearable?.rmssd ?? null,
    // ★ 수면중 안정시 심박이다. 일간(resting_heart_rate)이 아니다 —
    //   이 참가자 90일 실측에서 배란기 신호 강도가 일간 0.01 / 수면중 0.79 로
    //   일간 값에는 주기 패턴이 사실상 없다. 예전엔 일간을 그렸는데,
    //   그때는 시드 컬럼명 버그로 이 자리에 수면중 값이 들어가 있어서 잘 보였던 것이다.
    restingHeartRate: d.wearable?.sleep_resting_heart_rate ?? null,
  }));
}

/**
 * 오늘의 예측과 실측을 나란히. 예측 상세의 오차 카드용.
 *
 * pending 구간에도 직전 값을 유지한다. null 을 주면 AccuracyCard 가 통째로 사라지고
 * 2열 그리드가 출렁인다 — 예측이 도착하는 0.5초 동안 화면이 튀는 건 시연에서 눈에 띈다.
 */
export async function getAccuracyToday(day) {
  await ensureLoaded();
  if (isBeforeStart(day)) return null;

  let snap = getDaySnapshot(day);
  if (!snap?.prediction || !snap?.truth) {
    const scored = getDaysUpTo(day).filter((d) => d.prediction && d.truth);
    if (scored.length === 0) return null;
    snap = scored[scored.length - 1];
  }
  const isPending = snap.day !== day;

  const row = (key, label, unit) => {
    const predicted = snap.prediction[key];
    const actual = snap.truth[key];
    if (predicted == null || actual == null) {
      return { key, label, unit, predicted, actual, errorPct: null };
    }
    return {
      key,
      label,
      unit,
      predicted,
      actual,
      errorPct: actual === 0 ? null : ((predicted - actual) / Math.abs(actual)) * 100,
    };
  };

  return {
    date: snap.date,
    isPending,
    predictionDay: snap.day,
    phaseMatched: snap.prediction.phase === snap.truth.phase,
    phasePredicted: snap.prediction.phase,
    phaseActual: snap.truth.phase,
    hormones: [
      row("lh", "LH", "mIU/mL"),
      row("estrogen", "Estrogen", "ng/mL"),
      row("pdg", "PdG", "mcg/mL"),
    ],
  };
}

// pending 구간에 막대가 사라졌다 다시 나타나면 깜빡임이 된다. 직전 값을 유지한다.
/**
 * 히스토리 로그 — 하루마다 "무엇을 받아서(X) 무엇을 내놨는지(Y)".
 *
 * 화면 3탭이 "제품이 이렇게 생겼다"라면 이건 "DB 에 실제로 뭐가 쌓였나"다.
 * 파이썬 모델을 붙인 뒤 값이 이상할 때 제일 먼저 열어볼 자리라, 요약이 아니라
 * 원본 값을 그대로 보여준다.
 *
 * ★ 미래 일차는 안 준다. 아직 시뮬레이터가 넘기지 않은 날의 실측을 미리 보여주면
 *   시연에서 스포일러가 된다 (백엔드 timeline 도 같은 이유로 truth 를 가린다).
 *
 * 최신순(내림차순)이다 — 로그는 방금 일어난 일이 위에 있어야 한다.
 */
export async function getHistoryLog(day) {
  await ensureLoaded();
  if (isBeforeStart(day)) return [];

  // 예측 요청 이력(상태/지연/피처개수). 백엔드가 이 엔드포인트를 안 가진 구버전이면
  // 빈 Map 이 와서 job 칸만 비고 나머지는 그대로 나온다.
  const jobsByDate = await fetchJobsByDate();

  return getDaysUpTo(day)
    .map((d) => {
      const x = WEARABLE_CATALOG.map((f) => ({
        key: f.key,
        label: f.label,
        group: f.group,
        unit: f.unit,
        decimals: f.decimals,
        value: toDisplayValue(f.key, d.wearable?.[f.key]),
        measured: d.wearable?.[f.key] != null,
      }));
      const measured = x.filter((i) => i.measured).length;

      const p = d.prediction;
      const t = d.truth;
      const hormone = (k) => {
        const pv = p?.[k] ?? null;
        const av = t?.[k] ?? null;
        return {
          predicted: pv,
          actual: av,
          errorPct: pv == null || av == null || av === 0 ? null : ((pv - av) / Math.abs(av)) * 100,
        };
      };

      const job = jobsByDate.get(d.date) ?? null;

      return {
        day: d.day,
        date: d.date,
        // ★ 예측 결과(prediction)와 예측 "요청"(job)은 다르다.
        //   요청은 나갔는데 실패해서 결과가 없을 수 있다 — 파이썬 붙이면 그게 흔한 경우다.
        //   그 구분이 로그에서 보여야 진단이 된다.
        job: job && {
          status: job.status ?? null,
          latencyMs: job.latencyMs ?? null,
          errorMessage: job.errorMessage ?? null,
          historyDays: job.historyDays ?? null,
          // 44 가 아니면 그 자체가 버그 신호다 (NON_NULL 직렬화로 40개 나간 전례가 있다)
          featureCount: job.featureCount ?? null,
          responsePreview: job.responsePreview ?? null,
          startedAt: job.startedAt ?? null,
        },
        x,
        xMeasured: measured,
        xTotal: x.length,
        xGroups: WEARABLE_GROUPS.map((name) => ({
          name,
          items: x.filter((i) => i.group === name),
        })),
        // Y 가 없는 날이 정상이다 — 콜드스타트 구간(Day 1~19)은 수집만 한다.
        hasPrediction: !!p,
        modelVersion: p?.modelVersion ?? null,
        confidence: p?.confidence ?? null,
        phasePredicted: p?.phase ?? null,
        phaseActual: t?.phase ?? null,
        phaseMatched: p?.phase && t?.phase ? p.phase === t.phase : null,
        nextPeriod: p?.nextPeriod ?? null,
        hormones: [
          { key: "lh", label: "LH", unit: "mIU/mL", ...hormone("lh") },
          { key: "estrogen", label: "Estrogen", unit: "ng/mL", ...hormone("estrogen") },
          { key: "pdg", label: "PdG", unit: "mcg/mL", ...hormone("pdg") },
        ],
      };
    })
    .reverse();
}

export async function getContributions(day) {
  await ensureLoaded();
  return snapshotForPrediction(day)?.prediction?.contributions ?? [];
}

export async function getNextEvents(day) {
  await ensureLoaded();
  if (isBeforeStart(day)) return null;

  const source = snapshotForPrediction(day);
  if (!source) return null;   // 진짜 콜드스타트

  return {
    next_event_label: source.prediction.nextEvent?.label ?? null,
    days_to_next_event: source.prediction.nextEvent?.daysTo ?? null,
    next_period: source.prediction.nextPeriod ?? null,
    isPending: source.day !== day,
    predictionDay: source.day,
    predictionDate: source.date,
  };
}

// 캘린더는 day 시점까지 "도달한" 날짜만 상태를 갖는다. 아직 시뮬레이터가 넘기지 않은
// 미래 일차는 future 로 비워 두어 예측을 미리 스포일링하지 않는다.
export async function getCalendar(day) {
  await ensureLoaded();
  const coldStartDays = getColdStartDays();

  const days = getAllDays().map((d) => {
    if (d.day > day) return { date: d.date, status: "future" };
    if (!d.prediction) return { date: d.date, status: "collecting" };
    return { date: d.date, status: "predicted", phase: d.prediction.phase };
  });

  const current = getDaySnapshot(day);
  return {
    days,
    coldStartDays,
    next_period_estimate: current?.prediction?.nextPeriod?.date ?? null,
    next_period_range: current?.prediction?.nextPeriod ?? null,
  };
}
