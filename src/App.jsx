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

  return (
    <div
      className={`min-h-screen bg-neutral-50 dark:bg-slate-950 ${device === "pc" ? "pb-24" : "pb-10"}`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/80 px-6 py-3 backdrop-blur dark:border-white/5 dark:bg-slate-950/80">
        <h1 className="text-sm font-semibold dark:text-slate-100">호르몬 예측 대시보드</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-full bg-neutral-100 p-1 dark:bg-slate-900">
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
                      ? "bg-white shadow-sm dark:bg-slate-700 dark:text-amber-300"
                      : "opacity-60 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1 rounded-full bg-neutral-100 p-1 dark:bg-slate-900">
            {DEVICES.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDevice(d.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  device === d.key
                    ? "bg-white shadow-sm dark:bg-slate-700 dark:text-orange-300"
                    : "opacity-60 dark:text-slate-400"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
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
