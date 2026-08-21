// "2026-09-03" -> "2026년 9월 3일". 로컬 Date 파싱(new Date(문자열))은 타임존에 따라
// 하루 밀릴 수 있어(UTC 파싱) 문자열을 직접 쪼갠다.
export function formatKoreanDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}
