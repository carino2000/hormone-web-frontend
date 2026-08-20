import { CalendarDays, Home, LineChart } from "lucide-react";

// 페이지 내비게이션 단일 소스 — App.jsx(PC 하단 탭), MobileFrame(폰 하단 탭바),
// WatchFrame(워치 페이지 점 내비게이션)이 모두 이 배열을 공유한다.
export const NAV_ITEMS = [
  { to: "/", label: "홈", icon: Home, end: true },
  { to: "/prediction", label: "예측 상세", icon: LineChart, end: false },
  { to: "/calendar", label: "달력", icon: CalendarDays, end: false },
];
