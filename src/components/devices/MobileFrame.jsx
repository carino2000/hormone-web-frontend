import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/navItems";

// 실제 폰처럼 보이도록 케이스 옆면에 붙는 물리 버튼(무음 스위치, 볼륨 업/다운, 전원 버튼)을
// 베젤 바깥으로 살짝 튀어나온 작은 바 형태로 표현한다. 프레임 본체와 같은 relative 박스
// 안에서 절대 위치로 잡아야 좌/우 베젤 라인에 정확히 붙는다.
// 바깥쪽(폰 밖으로 튀어나온 끝)만 rounded-l/r-full로 둥글리고, 폰에 붙는 안쪽 변은
// 그대로 각지게 남겨 "1자로 딱 붙은" 느낌을 낸다 — 전체를 rounded-full로 덮으면 안 됨.
const SIDE_BUTTON_BASE = "absolute bg-neutral-600 shadow-sm dark:bg-slate-700";

export default function MobileFrame({ children }) {
  return (
    <div className="relative mx-auto w-[380px] max-w-full">
      {/* 좌측: 무음 스위치 + 볼륨 업/다운 */}
      <span className={`${SIDE_BUTTON_BASE} left-[-4px] top-[92px] h-5 w-[4px] rounded-l-full`} />
      <span className={`${SIDE_BUTTON_BASE} left-[-4px] top-[130px] h-12 w-[4px] rounded-l-full`} />
      <span className={`${SIDE_BUTTON_BASE} left-[-4px] top-[188px] h-12 w-[4px] rounded-l-full`} />
      {/* 우측: 전원/사이드 버튼 */}
      <span className={`${SIDE_BUTTON_BASE} right-[-4px] top-[150px] h-[76px] w-[4px] rounded-r-full`} />

      <div className="flex w-full flex-col overflow-hidden rounded-[2.5rem] border-8 border-neutral-900 bg-white shadow-xl dark:border-slate-950 dark:bg-slate-900 dark:shadow-black/50">
        {/* 상단 카메라 영역: 노치/센서 바 안쪽 오른편에 카메라 렌즈를 넣는다 */}
        <div className="relative mx-auto mt-4 mb-2 h-6 w-24 shrink-0 rounded-full bg-neutral-900 dark:bg-slate-800">
          <div className="absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-black ring-1 ring-neutral-700">
            <span className="absolute left-[3px] top-[3px] h-[3px] w-[3px] rounded-full bg-white/30" />
          </div>
        </div>
        <div className="no-scrollbar relative h-[652px] overflow-y-auto p-4">{children}</div>
        <nav className="flex shrink-0 items-center justify-around border-t border-black/5 bg-white py-2 dark:border-white/5 dark:bg-slate-900">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-4 py-1 text-[10px] font-medium transition ${
                  isActive ? "text-rose-400 dark:text-orange-400" : "text-neutral-400 dark:text-slate-500"
                }`
              }
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
