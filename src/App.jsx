import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import PredictionDetail from "./pages/PredictionDetail";
import Calendar from "./pages/Calendar";

const DEVICES = [
  { key: "pc", label: "PC" },
  { key: "mobile", label: "모바일" },
  { key: "watch", label: "워치" },
];

const PAGES = [
  { to: "/", label: "홈" },
  { to: "/prediction", label: "예측 상세" },
  { to: "/calendar", label: "달력" },
];

function App() {
  const [device, setDevice] = useState("pc");

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/80 px-6 py-3 backdrop-blur">
        <h1 className="text-sm font-semibold">호르몬 예측 대시보드</h1>
        <div className="flex gap-1 rounded-full bg-neutral-100 p-1">
          {DEVICES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDevice(d.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                device === d.key ? "bg-white shadow-sm" : "opacity-60"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 py-10">
        <Routes>
          <Route path="/" element={<Home device={device} />} />
          <Route path="/prediction" element={<PredictionDetail device={device} />} />
          <Route path="/calendar" element={<Calendar device={device} />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex justify-center gap-6 border-t border-black/5 bg-white/90 py-3 backdrop-blur">
        {PAGES.map((p) => (
          <NavLink
            key={p.to}
            to={p.to}
            end={p.to === "/"}
            className={({ isActive }) => `text-xs font-medium ${isActive ? "text-rose-400" : "opacity-50"}`}
          >
            {p.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default App;
