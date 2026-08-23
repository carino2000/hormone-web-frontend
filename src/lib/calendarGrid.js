// 달력 그리드 계산용 순수 함수 모음. React 의존 없음.

export const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function dateKeyOf(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

// year, month(1-12) 기준으로 해당 월을 포함하는 일요일 시작 주 단위 매트릭스를 만든다.
export function getMonthMatrix(year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = firstOfMonth.getDay();
  const lastOfMonth = new Date(year, month, 0);
  const totalWeeks = Math.ceil((startOffset + lastOfMonth.getDate()) / 7);

  const weeks = [];
  const cursor = new Date(year, month - 1, 1 - startOffset);
  for (let w = 0; w < totalWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
