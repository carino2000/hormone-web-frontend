// 데이터 접근의 단일 관문. 화면/카드 컴포넌트는 이 파일을 거치지 않고 fetch하거나
// simulationDays.json을 직접 import하면 안 된다 — dataSource를 'mock'에서 'api'로 바꿀 때
// 화면 코드를 한 줄도 안 건드리기 위한 경계선이다.
import simulationFixture from "../mocks/simulationDays.json";

const daysByNumber = new Map(simulationFixture.days.map((d) => [d.day, d]));

export const BASELINE = simulationFixture.baseline;
export const COLD_START_DAYS = simulationFixture.coldStartDays;
export const TOTAL_DAYS = simulationFixture.totalDays;

function assertMockSource(dataSource) {
  if (dataSource === "api") {
    // 실제 백엔드 계약이 확정되면 여기를 fetch(`/api/simulation/...`) 호출로 교체한다.
    // 지금은 "발표 중 백엔드가 죽어도 데모가 완주돼야 한다"는 원칙에 따라 목업만 지원한다.
    throw new Error(
      "dataSource='api'는 아직 연결되지 않았습니다. 백엔드 계약이 확정되면 simulationSource.js만 교체하세요.",
    );
  }
}

export function getDaySnapshot(day, { dataSource = "mock" } = {}) {
  assertMockSource(dataSource);
  return daysByNumber.get(day) ?? null;
}

// day를 포함해 그 이전까지의 모든 일차 스냅샷 — 예측 상세 탭의 누적 그래프용.
export function getDaysUpTo(day, { dataSource = "mock" } = {}) {
  assertMockSource(dataSource);
  return simulationFixture.days.filter((d) => d.day <= day);
}

export function getAllDays({ dataSource = "mock" } = {}) {
  assertMockSource(dataSource);
  return simulationFixture.days;
}
