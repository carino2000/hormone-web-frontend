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
import { endpoints } from "./endpoints";
import { httpGet, httpPost } from "./http";
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
    // 모델이 보는 컬럼은 47개 = 웨어러블 44 + 정적 3
    // (정적 3개 = birthYear / ageOfFirstMenarche / ethnicity, 엑셀 주황색).
    //
    // ★ 백엔드가 이걸 모델로 "보내는" 게 아니다. 요청은 일차 정수 하나뿐이고
    //   모델이 같은 원본 CSV 를 직접 읽는다. 이 패널은 "우리 DB 에 뭐가 쌓였고
    //   모델이 무엇을 보는가"를 같이 보여주는 것이지 전송 내역이 아니다.
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
 * 지금 화면의 예측이 어느 모델 버전으로 계산됐는지 (P-03).
 *
 * 모델이 modelVersion 을 안 주면 null 이고, 배지가 "예측 대기"로 남는다.
 */
export async function getModelInfo() {
  await ensureLoaded();
  const withPrediction = getAllDays()
    .filter((d) => d.prediction?.modelVersion)
    .pop();
  return {
    modelVersion: withPrediction?.prediction?.modelVersion ?? null,
    source: "backend",
  };
}

/**
 * 전체 구간 정확도 (P-03 모델 성능 탭).
 *
 * 예측(모델 출력)과 실측(시드의 truth)을 비교해 백엔드 데이터만으로 계산한다.
 *
 * ★ 이 참가자(id=22 / 2024)가 학습에서 제외됐는지는 모델팀 확인 사항이다.
 *   제외되지 않았다면 여기 수치가 부풀려진다 — 화면이 그걸 알아낼 방법은 없다.
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
          // 파이썬에 실제로 보낸 일차. 백엔드 Day 와 다를 수 있다(day-offset 보정).
          sentDay: job.sentDay ?? null,
          responsePreview: job.responsePreview ?? null,
          startedAt: job.startedAt ?? null,
        },
        x,
        xMeasured: measured,
        xTotal: x.length,
        /**
         * 접힌 줄에 띄울 신호 요약 3개.
         *
         * 콜드스타트 구간(예측 전)은 Y 가 없어서 줄이 텅 비어 보였다. 그런데 그날도
         * 웨어러블은 멀쩡히 들어와 있다 — "아무 일도 없던 날"이 아니라 "수집만 한 날"이다.
         * 그걸 보여주려고 실제로 측정된 신호 몇 개를 뽑는다.
         *
         * 홈 6칸과 같은 키를 쓰되 <b>측정된 것만</b> 고른다. 결측인 칸을 "—" 로 채우면
         * 요약이 오히려 비어 보인다. 이 참가자는 하루 44개 중 31~41개만 들어오므로
         * 어떤 키가 빌지 날마다 다르다.
         */
        xSummary: HOME_VITAL_KEYS.map((k) => x.find((i) => i.key === k))
          .filter((i) => i && i.measured)
          .slice(0, 3)
          .map((i) => ({
            key: i.key,
            label: i.label,
            // 카탈로그의 decimals 로 자른다. 원값을 그대로 쓰면 rmssd 가
            // "55.685", restlessness 가 "0.0629" 처럼 나와서 홈 타일(51.2 / 0.07)과
            // 자릿수가 달라 보인다 — 같은 신호인데 화면마다 다르면 안 된다.
            value:
              typeof i.value === "number" ? i.value.toFixed(i.decimals ?? 0) : i.value,
            unit: i.unit,
          })),
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
        hormones: [
          { key: "lh", label: "LH", unit: "mIU/mL", ...hormone("lh") },
          { key: "estrogen", label: "Estrogen", unit: "ng/mL", ...hormone("estrogen") },
          { key: "pdg", label: "PdG", unit: "mcg/mL", ...hormone("pdg") },
        ],
      };
    })
    .reverse();
}

/**
 * 예측 근거(신호 기여도). **모델팀이 못 준다고 해서 현재는 항상 빈 배열이다.**
 * (모델 4개가 CNN/MixedLM/스태킹/T-LSTM 으로 제각각이라 통일된 기여도를 못 뽑는다)
 *
 * 호출부(PredictionDetail)가 길이 0 이면 카드를 렌더하지 않는다. 나중에 모델이
 * 주기 시작하면 이 함수도 화면도 그대로 두고 값만 채워진다.
 */
export async function getContributions(day) {
  await ensureLoaded();
  return snapshotForPrediction(day)?.prediction?.contributions ?? [];
}

/**
 * 예측 상세가 "예측이 하나라도 있는가"를 판정하고 오늘 예측 요약을 얻는 창구.
 *
 * ★ 이름이 예전에 getNextEvents 였다. 다음 월경 예정일을 다루던 함수인데,
 *   모델이 오늘자 phase 만 준다고 해서 그 기능을 뺐다. 지금은 phase·확신도·모델버전만 준다.
 *
 * null 이면 **진짜 콜드스타트**다 (예측이 한 번도 없었음). pending 은 null 이 아니다 —
 * 직전 예측으로 대체해서 준다.
 */
export async function getTodayPrediction(day) {
  await ensureLoaded();
  if (isBeforeStart(day)) return null;

  const source = snapshotForPrediction(day);
  if (!source) return null;   // 진짜 콜드스타트

  const p = source.prediction;
  return {
    phase: p.phase ?? null,
    phase_label_ko: p.phaseLabelKo ?? PHASE_LABELS_KO[p.phase] ?? null,
    confidence: p.confidence ?? null,
    modelVersion: p.modelVersion ?? null,
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

  // 다음 월경 예정일은 모델이 주지 않는다(합의 하에 제외). 오늘 단계만 내려준다.
  const current = getDaySnapshot(day);
  return {
    days,
    coldStartDays,
    today_phase: current?.prediction?.phase ?? null,
    today_phase_label_ko:
      current?.prediction?.phaseLabelKo ?? PHASE_LABELS_KO[current?.prediction?.phase] ?? null,
  };
}

// ---------------------------------------------------------------------------
// 오늘의 조언 (Claude API)
//
// 다른 API 와 달리 simulationSource 캐시를 타지 않는다. 타임라인 스냅샷과 달리
// 조언은 생성 시점이 따로 있고(하루 넘기기 직후), 실패/재시도 상태를 그때그때
// 반영해야 하기 때문이다.
// ---------------------------------------------------------------------------

/** 기능이 켜져 있는지. 키가 없으면 화면이 토글을 비활성화한다. */
export async function getAdviceStatus() {
  try {
    return await httpGet(endpoints.adviceStatus());
  } catch {
    return { enabled: false, model: null, historyDays: null };
  }
}

/** 지난 조언 전부 (최신순). */
export async function getAdviceList() {
  try {
    return await httpGet(endpoints.adviceList());
  } catch {
    return [];
  }
}

/**
 * 오늘 조언 생성. 이미 성공한 날은 백엔드가 재호출하지 않고 저장된 걸 준다.
 *
 * ★ 첫 호출은 15~20초 걸린다 (최근 30일 웨어러블 1만 토큰을 읽는다).
 *   호출부는 await 로 화면을 막지 말고 로딩 상태로 처리할 것.
 */
export async function generateAdvice({ force = false } = {}) {
  // ★ 기본 타임아웃(10초)으로는 잘린다. 최근 30일 웨어러블 약 1만 토큰을 읽고
  //   조언을 쓰는 데 15~20초가 걸린다 (실측 16.9초). 백엔드 read-timeout 은 60초라
  //   프론트를 그보다 넉넉히 잡아 백엔드가 먼저 판정하게 둔다.
  return httpPost(endpoints.adviceGenerate(undefined, force), undefined, { timeoutMs: 90_000 });
}
