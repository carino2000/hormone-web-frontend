import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import Home from "./pages/Home";
import PredictionDetail from "./pages/PredictionDetail";
import Calendar from "./pages/Calendar";
import ModelPerformance from "./pages/ModelPerformance";
import HistoryLog from "./pages/HistoryLog";
import Advice from "./pages/Advice";
import { NAV_ITEMS } from "./lib/navItems";
import SimulatorBar from "./components/simulator/SimulatorBar";
import DataSourceBadge from "./components/DataSourceBadge";
import { useSimulationAutoplay } from "./state/useSimulationAutoplay";
import { usePredictionSocket } from "./lib/usePredictionSocket";
import { useSimulationStore } from "./state/simulationStore";

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
  useSimulationAutoplay();
  usePredictionSocket();

  // 백엔드가 유일한 데이터 소스다. 마운트 시 타임라인을 받아 현재 일차까지 복원한다.
  const init = useSimulationStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

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

  // 예전에는 모바일/워치 프리뷰일 때만 프레임 바깥(헤더·캔버스)이 라이트로 고정되고,
  // PC일 때만 다크모드가 반영됐다 — 탭을 옮기면 셸 배경이 제멋대로 바뀌는 것처럼 보여서
  // device 조건을 없앴다. 이제 셸은 device와 무관하게 항상 theme를 그대로 따른다(다른
  // 카드들처럼 순수 dark: 유틸리티로 처리 — 프레임 자체도 이미 이 방식이었다).
  const isPhoneDevice = device === "mobile" || device === "watch";

  return (
    // 데모 컨트롤을 오른쪽 사이드 패널로 분리한 레이아웃: [헤더] 아래로 [프리뷰 영역 | 컨트롤
    // 패널]이 나란히 앉는다. 컨트롤이 더 이상 프리뷰 아래에 쌓이지 않으므로 디바이스 프레임
    // 높이와 경쟁하지 않는다 — 프리뷰 쪽이 넘치면 그 컬럼만, 컨트롤이 넘치면 패널만 각자
    // 스크롤한다.
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50 dark:bg-slate-950">
      <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 py-3 text-neutral-900 dark:border-white/5 dark:bg-slate-950 dark:text-slate-100">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">호르몬 예측 대시보드</h1>
          {/* 지금 화면의 숫자가 어디서 나왔는지 항상 보이게 한다 (P-03) */}
          <DataSourceBadge />
        </div>
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
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-slate-700 dark:text-amber-300"
                      : "opacity-60"
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
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-slate-700 dark:text-orange-300"
                    : "opacity-60"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 프리뷰 컬럼: 헤더 아래 남은 공간을 전부 쓰고, 내용이 넘치면 이 컬럼만 스크롤된다. */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main
            // 폰/워치 목업은 프레임 자체가 화면을 흉내 내므로 바깥 여백을 줄이고
            // 남는 높이를 프레임에 넘긴다(min-h-0 이 있어야 flex 자식이 줄어든다).
            className={`flex-1 overflow-y-auto px-6 ${
              isPhoneDevice ? "flex min-h-0 flex-col items-center py-6" : "py-10"
            }`}
          >
            <Routes>
              <Route path="/" element={<Home device={device} />} />
              <Route path="/prediction" element={<PredictionDetail device={device} theme={theme} />} />
              <Route path="/calendar" element={<Calendar device={device} />} />
              <Route path="/model" element={<ModelPerformance device={device} theme={theme} />} />
              <Route path="/advice" element={<Advice device={device} />} />
              <Route path="/history" element={<HistoryLog device={device} />} />
            </Routes>
          </main>

          {/* 모바일/워치는 각자의 프레임(MobileFrame 하단 탭바, WatchFrame 페이지 점)이 자체
              내비게이션을 갖고 있으므로, 여기서는 PC 미리보기용 탭만 보여준다. 프리뷰 컬럼의
              고정 하단 바로 배치(사이드 패널 아래까지 번지지 않게). */}
          {device === "pc" && (
            <nav className="flex shrink-0 justify-center gap-6 border-t border-black/5 bg-white py-3 dark:border-white/5 dark:bg-slate-950">
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

        {/* 데모 컨트롤 패널 — 프리뷰와 분리된 자기 컬럼이라 디바이스 프레임 크기에
            영향을 주지 않는다. 다른 셸 요소와 마찬가지로 theme를 그대로 따른다. */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-black/5 bg-white dark:border-white/10 dark:bg-slate-900">
          <SimulatorBar />
        </aside>
      </div>
    </div>
  );
}

export default App;
