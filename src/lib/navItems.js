import { Activity, CalendarDays, Home, LineChart, ScrollText, Sparkles } from "lucide-react";

// 페이지 내비게이션 단일 소스 — App.jsx(PC 하단 탭), MobileFrame(폰 하단 탭바),
// WatchFrame(워치 페이지 점 내비게이션)이 모두 이 배열을 공유한다.
//
// 앞의 3개는 "제품은 이렇게 생깁니다", "모델 성능"은 "모델은 이만큼 맞힙니다".
// 대표 시연에서는 후자가 본론이다 (P-03).
//
// "기록"은 DB 에 실제로 뭐가 쌓였나를 보는 자리다(워치에서는 웨어러블 신호 타일).
//
// ★ "조언"이 맨 끝인 이유: Claude 호출을 켜야 내용이 생기고 안 켠 날은 비어 있다.
//   비는 탭이 중간에 있으면 넘기다가 빈 화면을 만나는데, 워치처럼 화면 하나에
//   하나씩 넘기는 뷰에서 특히 눈에 띈다. 비어 있을 수 있는 건 끝으로 뺀다.
export const NAV_ITEMS = [
  { to: "/", label: "홈", icon: Home, end: true },
  { to: "/prediction", label: "예측 상세", icon: LineChart, end: false },
  { to: "/calendar", label: "달력", icon: CalendarDays, end: false },
  { to: "/model", label: "모델 성능", icon: Activity, end: false },
  { to: "/history", label: "기록", icon: ScrollText, end: false },
  { to: "/advice", label: "조언", icon: Sparkles, end: false },
];
