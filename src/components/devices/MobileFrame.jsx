import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/navItems";

// 실제 폰처럼 보이도록 케이스 옆면에 붙는 물리 버튼(무음 스위치, 볼륨 업/다운, 전원 버튼)을
// 베젤 바깥으로 살짝 튀어나온 작은 바 형태로 표현한다. 프레임 본체와 같은 relative 박스
// 안에서 절대 위치로 잡아야 좌/우 베젤 라인에 정확히 붙는다.
// 바깥쪽(폰 밖으로 튀어나온 끝)만 rounded-l/r-full로 둥글리고, 폰에 붙는 안쪽 변은
// 그대로 각지게 남겨 "1자로 딱 붙은" 느낌을 낸다 — 전체를 rounded-full로 덮으면 안 됨.
const SIDE_BUTTON_BASE = "absolute bg-neutral-600 shadow-sm dark:bg-slate-700";

/**
 * 폰 목업 프레임.
 *
 * ★ <b>화면 높이가 고정이 아니다.</b> 예전에는 스크롤 영역이 h-[652px] 고정이라
 *   프레임 전체가 778px 이었는데, 창이 조금만 낮아도 바깥 컬럼에 스크롤이 생겨
 *   <b>목업 폰이 페이지 안에서 잘려 보였다</b>. 폰 안이 아니라 페이지가 스크롤되는 건
 *   목업의 환상을 깬다.
 *
 *   그래서 부모가 주는 높이를 그대로 채우고(flex-1 + min-h-0), 내용은 <b>폰 안쪽</b>에서만
 *   스크롤된다. 실제 폰이 그렇게 동작한다.
 *
 * ★ max-h 로 상한을 둔다. 세로로 아주 긴 창에서 폰이 끝없이 늘어나면 비율이 무너진다.
 * ★ min-h 로 하한도 둔다 — 창이 아주 낮을 때 폰이 납작해지느니 스크롤이 낫다.
 */
export default function MobileFrame({ children }) {
  return (
    <div className="relative mx-auto flex min-h-[560px] w-[380px] max-w-full flex-1 flex-col"
         style={{ maxHeight: 780, minHeight: 0 }}>
      {/* 좌측: 무음 스위치 + 볼륨 업/다운 */}
      <span className={`${SIDE_BUTTON_BASE} left-[-4px] top-[92px] h-5 w-[4px] rounded-l-full`} />
      <span className={`${SIDE_BUTTON_BASE} left-[-4px] top-[130px] h-12 w-[4px] rounded-l-full`} />
      <span className={`${SIDE_BUTTON_BASE} left-[-4px] top-[188px] h-12 w-[4px] rounded-l-full`} />
      {/* 우측: 전원/사이드 버튼 */}
      <span className={`${SIDE_BUTTON_BASE} right-[-4px] top-[150px] h-[76px] w-[4px] rounded-r-full`} />

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[2.5rem] border-8 border-neutral-900 bg-white shadow-xl dark:border-slate-950 dark:bg-slate-900 dark:shadow-black/50">
        {/* 상단 카메라 영역: 노치/센서 바 안쪽 오른편에 카메라 렌즈를 넣는다 */}
        <div className="relative mx-auto mt-4 mb-2 h-6 w-24 shrink-0 rounded-full bg-neutral-900 dark:bg-slate-800">
          <div className="absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-black ring-1 ring-neutral-700">
            <span className="absolute left-[3px] top-[3px] h-[3px] w-[3px] rounded-full bg-white/30" />
          </div>
        </div>
        <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
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
