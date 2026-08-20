import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import Home from "./pages/Home";
import PredictionDetail from "./pages/PredictionDetail";
import Calendar from "./pages/Calendar";
import { NAV_ITEMS } from "./lib/navItems";

const DEVICES = [
  { key: "pc", label: "PC" },
  { key: "mobile", label: "모바일" },
  { key: "watch", label: "워치" },
];

const THEMES = [
  { key: "light", label: "라이트", icon: Sun },
  { key: "dark", label: "다크", icon: Moon },
];

const THEME_STORAGE_KEY = "hormone-web:theme";

function App() {
  const [device, setDevice] = useState("pc");
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // 저장 실패(프라이빗 모드 등)는 조용히 무시 — 테마 기억은 필수 기능이 아님
    }
  }, [theme]);

  // 모바일/워치는 기기 프레임이 화면 위에 "떠 있는 사물"처럼 보여야 하므로, 다크모드를
  // 선택해도 프레임 바깥(헤더·캔버스 배경)은 밝게 유지한다 — 어두운 배경 위에 검은
  // 폰/워치 베젤이 묻히지 않게. 프레임 안쪽(실제 화면 콘텐츠)은 device와 무관하게 항상
  // theme를 그대로 따른다(각 카드가 자체적으로 dark: 유틸리티를 쓴다).
  const shellDark = theme === "dark" && device === "pc";
  // 모바일/워치는 기기 미리보기 한 장이 화면에 딱 들어오면 되는 구조라, 페이지 자체가
  // 뷰포트보다 커져서 바깥(흰 배경) 스크롤이 생기는 걸 원치 않는다. h-screen + overflow-hidden으로
  // 바깥 스크롤을 아예 없애고, 안쪽 main만 필요하면 스크롤되게 한다(폰 프레임 내부 스크롤은 별개).
  const isPhoneDevice = device === "mobile" || device === "watch";

  return (
    <div
      className={`${isPhoneDevice ? "flex h-screen flex-col overflow-hidden" : "min-h-screen"} ${
        shellDark ? "bg-slate-950" : "bg-neutral-50"
      } ${device === "pc" ? "pb-24" : ""}`}
    >
      <header
        className={`sticky top-0 z-10 flex shrink-0 items-center justify-between border-b px-6 py-3 backdrop-blur ${
          shellDark ? "border-white/5 bg-slate-950/80 text-slate-100" : "border-black/5 bg-white/80 text-neutral-900"
        }`}
      >
        <h1 className="text-sm font-semibold">호르몬 예측 대시보드</h1>
        <div className="flex items-center gap-2">
          <div className={`flex gap-1 rounded-full p-1 ${shellDark ? "bg-slate-900" : "bg-neutral-100"}`}>
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key)}
                  aria-label={`${t.label} 모드`}
                  aria-pressed={active}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? theme === "dark"
                        ? "bg-slate-700 text-amber-300"
                        : "bg-white text-neutral-900 shadow-sm"
                      : "opacity-60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className={`flex gap-1 rounded-full p-1 ${shellDark ? "bg-slate-900" : "bg-neutral-100"}`}>
            {DEVICES.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDevice(d.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  device === d.key
                    ? shellDark
                      ? "bg-slate-700 text-orange-300"
                      : "bg-white text-neutral-900 shadow-sm"
                    : "opacity-60"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={`px-6 ${isPhoneDevice ? "flex flex-1 items-start justify-center overflow-y-auto py-6" : "py-10"}`}>
        <Routes>
          <Route path="/" element={<Home device={device} />} />
          <Route path="/prediction" element={<PredictionDetail device={device} theme={theme} />} />
          <Route path="/calendar" element={<Calendar device={device} />} />
        </Routes>
      </main>

      {/* 모바일/워치는 각자의 프레임(MobileFrame 하단 탭바, WatchFrame 페이지 점)이 자체
          내비게이션을 갖고 있으므로, 여기서는 PC 미리보기용 탭만 보여준다. */}
      {device === "pc" && (
        <nav className="fixed inset-x-0 bottom-0 flex justify-center gap-6 border-t border-black/5 bg-white/90 py-3 backdrop-blur dark:border-white/5 dark:bg-slate-950/90">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `text-xs font-medium ${
                  isActive ? "text-rose-400 dark:text-orange-400" : "opacity-50 dark:text-slate-400"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export default App;
