// 워치 뷰의 상수·헬퍼. WATCH_UI_DESIGN_GUIDE.md §3 참고.
//
// ★ 컴포넌트 파일(watchParts.jsx)에서 분리한 이유: 한 파일이 컴포넌트와 상수를 같이
//   export 하면 Vite 의 Fast Refresh 가 깨진다(eslint react-refresh 규칙).
//   색 값 자체는 index.css 의 .watch-view 토큰이 단일 진실이고, 여기 있는 건
//   "그 토큰을 가리키는 이름"과 JS 에서만 필요한 그라디언트 쌍이다.

const PHASE_TOKEN = {
  Menstrual: "--ph-menstrual",
  Follicular: "--ph-follicular",
  Fertility: "--ph-fertile",
  Luteal: "--ph-luteal",
};

/**
 * 판정 밴드 그라디언트.
 *
 * ★ 위상마다 색이 바뀐다. 브랜드 앰버로 고정하지 않는 이유는, 워치에서 위상이
 *   매일 바뀌는 유일한 변수라 색이 안 바뀌면 밴드가 정보를 하나도 안 나르기 때문이다.
 *   대신 <b>형태</b>(풀블리드 + 가로 그라디언트 + 검정 볼드)를 고정해 브랜드를 유지하고,
 *   <b>가임기가 앰버</b>라 사이클의 피크가 자사 앱과 같은 색이 된다.
 *
 * ★ <b>hex 를 들고 있지 않는다.</b> 예전엔 여기 4쌍을 박아뒀는데 index.css 팔레트와
 *   따로 놀아서 같은 위상이 밴드와 달력에서 다른 색으로 보였다. 지금은 위상 토큰
 *   하나에서 시작해 흰색을 섞어 밝은 정지점을 만든다 — 팔레트를 바꾸면 밴드도 같이 바뀐다.
 */
export function bandGradient(phase) {
  if (!PHASE_TOKEN[phase]) {
    // 위상을 모를 때는 중립 회색. 위상 색을 아무거나 고르면
    // "그 위상으로 판정했다"는 없는 정보를 만들어낸다.
    return "linear-gradient(90deg, #3a3a40 0%, #55555c 100%)";
  }
  const c = phaseColor(phase);
  return `linear-gradient(90deg, ${c} 0%, color-mix(in srgb, ${c}, white 34%) 100%)`;
}

/** ★ 고정 표기. 다른 이름으로 바꾸지 말 것 (가이드 §8). */
export const PHASE_KO = {
  Menstrual: "월경기",
  Follicular: "난포기",
  Fertility: "가임기",
  Luteal: "황체기",
};

/** 위상 → CSS 토큰 참조. 모르는 위상이면 빈 칸 색으로 떨어진다. */
export function phaseColor(phase) {
  const t = PHASE_TOKEN[phase];
  return t ? `var(${t})` : "var(--ph-empty)";
}

/** 값이 없을 때 쓰는 표기. ★ 0 으로 렌더하지 말 것 (가이드 §8 결측 처리). */
export const EMPTY = "—";
