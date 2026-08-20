import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/navItems";

// watchOS/Wear OS의 "페이지 점(dot) 내비게이션" 관례를 따른다 — 화면 하나에 화면 하나의
// 정보만 담고, 좌우로 넘기는 페이지들 사이를 화면 아래쪽의 작은 점으로 표시/이동한다.
export default function WatchFrame({ children }) {
  return (
    <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-[2.5rem] border-8 border-neutral-900 bg-black p-3 shadow-xl">
      <div className="flex h-full w-full flex-col items-center rounded-[2rem] bg-neutral-950 px-3 pt-4 pb-2.5 text-white">
        <div className="flex flex-1 items-center justify-center">{children}</div>
        <div className="flex items-center gap-1.5">
          {NAV_ITEMS.map(({ to, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `h-1.5 rounded-full transition-all ${isActive ? "w-4 bg-rose-400" : "w-1.5 bg-neutral-700"}`
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
