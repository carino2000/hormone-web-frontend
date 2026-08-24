import { Activity, CalendarDays, Home, LineChart, ScrollText, Sparkles } from "lucide-react";

// 페이지 내비게이션 단일 소스 — App.jsx(PC 하단 탭), MobileFrame(폰 하단 탭바),
// WatchFrame(워치 페이지 점 내비게이션)이 모두 이 배열을 공유한다.
//
// 앞의 3개는 "제품은 이렇게 생깁니다", "모델 성능"은 "모델은 이만큼 맞힙니다".
// 대표 시연에서는 후자가 본론이다 (P-03).
//
// "조언"은 Claude API 로 받는 생활 제안이다 — 토글을 켜면 하루 넘길 때마다 자동으로 받는다.
// 마지막 "기록"은 성격이 다르다 — 제품 화면이 아니라 **DB 에 실제로 뭐가 쌓였나**를
// 보는 운영자 화면이다. 파이썬 모델을 붙인 뒤 값이 이상할 때 여는 자리라 맨 끝에 둔다.
export const NAV_ITEMS = [
  { to: "/", label: "홈", icon: Home, end: true },
  { to: "/prediction", label: "예측 상세", icon: LineChart, end: false },
  { to: "/calendar", label: "달력", icon: CalendarDays, end: false },
  { to: "/model", label: "모델 성능", icon: Activity, end: false },
  { to: "/advice", label: "조언", icon: Sparkles, end: false },
  { to: "/history", label: "기록", icon: ScrollText, end: false },
];
