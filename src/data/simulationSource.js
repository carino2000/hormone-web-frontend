// 데이터 접근의 단일 관문. 화면/카드 컴포넌트는 이 파일을 거치지 않고 fetch 하면 안 된다.
//
// ★ 진실은 백엔드 하나다.
// 예전에는 로컬 목업 픽스처(simulationDays.json)와 백엔드 두 갈래를 두고 토글로 전환했다.
// 발표 중 백엔드가 죽어도 데모가 완주되게 하려던 안전망이었는데, 데이터가 두 벌이라
// "백엔드 꺼져 있는데 왜 화면이 돌지?" 같은 혼란이 생겼다. 시연을 녹화 영상으로
// 하기로 하면서 안전망이 필요 없어졌고, 목업을 통째로 걷어냈다.
//
// 백엔드가 안 뜨면 화면은 명시적으로 에러를 보여준다. 그게 정직하다.
import { fetchTimeline } from "./apiSource";

// 백엔드에서 타임라인을 받기 전까지 쓰는 임시값. 실제 값은 응답이 오면 덮어쓴다.
// (차트 X축 도메인 같은 게 첫 렌더에서 NaN 이 되지 않도록 하는 용도일 뿐이다)
export const DEFAULT_TOTAL_DAYS = 90;
export const DEFAULT_COLD_START_DAYS = 20;

let cache = null;
let inflight = null;

export function isLoaded() {
  return cache !== null;
}

/**
 * 타임라인을 확보한다. 이미 있으면 즉시 반환.
 * 동시에 여러 화면이 호출해도 요청은 한 번만 나간다.
 */
export async function ensureLoaded() {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetchTimeline()
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** 백엔드 상태가 바뀌었으니 다음 조회 때 새로 받아오라는 신호. */
export function invalidateCache() {
  cache = null;
}

export function getMeta() {
  return cache
    ? {
        coldStartDays: cache.coldStartDays,
        totalDays: cache.totalDays,
        currentDay: cache.currentDay,
        status: cache.status,
      }
    : null;
}

// ---------------------------------------------------------------------------
// 조회 — 전부 캐시에서 동기로 읽는다.
// 화면 컴포넌트가 getDaySnapshot 을 동기 호출하기 때문에(Calendar, SimulatorBar),
// 캐시를 채우는 건 api/index.js 가 ensureLoaded() 로 await 한다.
// ---------------------------------------------------------------------------

export function getBaseline() {
  return cache?.baseline ?? {};
}

export function getColdStartDays() {
  return cache?.coldStartDays ?? DEFAULT_COLD_START_DAYS;
}

export function getTotalDays() {
  return cache?.totalDays ?? DEFAULT_TOTAL_DAYS;
}

export function getDaySnapshot(day) {
  return cache?.days.find((d) => d.day === day) ?? null;
}

/** day 를 포함해 그 이전까지의 모든 일차 — 예측 상세 탭의 누적 그래프용. */
export function getDaysUpTo(day) {
  return (cache?.days ?? []).filter((d) => d.day <= day);
}

export function getAllDays() {
  return cache?.days ?? [];
}
