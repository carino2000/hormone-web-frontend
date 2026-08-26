/**
 * 호르몬 차트와 웨어러블 차트가 <b>공유</b>하는 X축 창(window) 계산.
 *
 * ★ 두 차트는 세로로 붙어 있고 X축이 정확히 같아야 한다. 눈금이 어긋나면
 *   "LH 서지 때 HRV 가 떨어진다"는 대응을 읽을 수 없다 — 이 화면의 존재 이유가 사라진다.
 *   그래서 각 차트가 따로 계산하지 않고 <b>여기 하나</b>를 부른다.
 *
 * ★ PC 는 전체 구간(1~totalDays)을 그대로 본다. 하루씩 넘길 때 오른쪽으로 곡선이
 *   자라나는 연출이 이 화면의 핵심이라 축을 고정한다.
 *
 * ★ 모바일은 <b>30일 창</b>으로 좁힌다. 폭이 300px 남짓인데 83일을 다 밀어 넣으면
 *   점이 겹쳐서 곡선이 뭉개지고, 진행 초반에는 데이터가 왼쪽 3분의 1에 몰려
 *   오른쪽이 텅 빈 채로 남는다(실제로 그렇게 보였다).
 */

/** 모바일에서 한 화면에 보여줄 일수. */
export const MOBILE_WINDOW = 30;

/**
 * @param {object}  o
 * @param {number}  o.currentDay   현재 일차
 * @param {number}  o.totalDays    전체 일수 (83)
 * @param {number}  o.coldStartDays 예측 시작일 (15) — 기준선 표시 여부 판단용
 * @param {string}  o.device       'pc' | 'mobile'
 * @returns {{from:number, to:number, ticks:number[], showColdStartLine:boolean}}
 */
export function getChartWindow({ currentDay, totalDays, coldStartDays, device }) {
  if (device !== "mobile") {
    return {
      from: 1,
      to: totalDays,
      ticks: [1, coldStartDays, Math.round(totalDays / 2), totalDays],
      showColdStartLine: true,
    };
  }

  // 창 <b>너비는 항상 30일로 고정</b>이다. 넓이가 매일 바뀌면 곡선의 기울기가 같이
  // 변해서 "어제보다 급해졌나?" 하는 착시가 생긴다. 범위만 오른쪽으로 민다.
  //
  // Day 30 까지는 [1,30] 에 머문다 — 시연의 하이라이트(Day 15 첫 예측, Day 21 LH 서지)가
  // 전부 이 구간이라, 초반에는 PC 와 똑같이 "곡선이 자라나는" 연출이 그대로 살아 있다.
  const to = Math.max(MOBILE_WINDOW, Math.min(currentDay, totalDays));
  const from = to - MOBILE_WINDOW + 1;

  const span = to - from;
  const ticks = [
    from,
    from + Math.round(span / 3),
    from + Math.round((span * 2) / 3),
    to,
  ];

  return {
    from,
    to,
    ticks,
    // 창이 예측 시작일을 지나가 버리면 기준선을 그릴 자리가 없다. 축 밖에 그리면
    // recharts 가 왼쪽 끝에 붙여 버려서 "여기가 예측 시작"이라는 거짓 표시가 된다.
    showColdStartLine: coldStartDays >= from && coldStartDays <= to,
  };
}

/**
 * 창 밖 데이터를 잘라낸다.
 *
 * domain 만 좁히고 데이터를 그대로 두면 Y축이 <b>보이지도 않는 구간</b>까지 포함해
 * 스케일을 잡는다. 예를 들어 estrogen 이 과거에 250 까지 갔으면, 지금 창이 60~90
 * 구간이어도 Y축이 0~250 으로 잡혀서 곡선이 바닥에 눌린다.
 */
export function sliceToWindow(data, { from, to }) {
  return data.filter((d) => d.day >= from && d.day <= to);
}
