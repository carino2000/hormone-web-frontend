import { useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/navItems";

const SWIPE_THRESHOLD = 36; // 이 이상 끌어야 페이지 전환으로 인정
const FREE_DRAG = 70; // 이 구간까지는 손가락/마우스를 그대로 따라간다
const MAX_DRAG = 110; // 그 이상은 고무줄처럼 저항이 걸리며 절대 이 값을 넘지 않는다

function currentPageIndex(pathname) {
  const index = NAV_ITEMS.findIndex((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  );
  return index === -1 ? 0 : index;
}

// FREE_DRAG까지는 1:1로 따라오다가, 그 이상 끌면 점점 덜 움직이는 고무줄(rubber-band)
// 저항을 준다 — 실제 터치 UI(iOS 오버스크롤 등)에서 흔히 쓰는 방식이라 훨씬 손에 붙는 느낌이 난다.
function withRubberBand(delta) {
  const sign = Math.sign(delta);
  const abs = Math.abs(delta);
  if (abs <= FREE_DRAG) return delta;
  const extra = abs - FREE_DRAG;
  const damped = FREE_DRAG + extra * 0.4;
  return sign * Math.min(damped, MAX_DRAG);
}

// watchOS/Wear OS의 "페이지 점(dot) 내비게이션" 관례를 따른다 — 화면 하나에 화면 하나의
// 정보만 담고, 좌우로 넘기는 페이지들 사이를 화면 아래쪽의 작은 점으로 표시/이동한다.
// 점을 눌러도 되고, 실제 워치처럼 화면을 좌우로 끌어서(마우스/터치 드래그) 넘길 수도 있다.
export default function WatchFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dragState = useRef({ startX: 0, dragging: false });
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pageIndex = currentPageIndex(location.pathname);

  const handlePointerDown = (e) => {
    dragState.current = { startX: e.clientX, dragging: true };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    setDragX(withRubberBand(delta));
  };

  const endDrag = (e) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    dragState.current.dragging = false;
    setIsDragging(false);
    setDragX(0);

    if (delta <= -SWIPE_THRESHOLD && pageIndex < NAV_ITEMS.length - 1) {
      navigate(NAV_ITEMS[pageIndex + 1].to);
    } else if (delta >= SWIPE_THRESHOLD && pageIndex > 0) {
      navigate(NAV_ITEMS[pageIndex - 1].to);
    }
  };

  return (
    <div className="relative mx-auto h-64 w-64">
      {/* 우측: 사이드 버튼 — 워치 본체와 같은 relative 박스 안에서 절대 위치로 붙여
          케이스 옆면에 튀어나온 것처럼 보이게 한다. 표면에는 동전 옆면 같은 가는 홈을
          음영으로 넣어 손잡이 돌기 질감을 낸다. */}
      <span
        className="absolute right-[-5px] top-[92px] h-10 w-[5px] rounded-r-full bg-neutral-500 shadow-sm"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden
      />

      <div className="flex h-full w-full items-center justify-center rounded-[2.5rem] border-8 border-neutral-900 bg-black p-3 shadow-xl">
        <div className="flex h-full w-full flex-col items-center overflow-hidden rounded-[2rem] bg-neutral-950 px-3 pt-4 pb-2.5 text-white">
          <div
            className="flex w-full flex-1 touch-pan-y select-none items-center justify-center"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className={isDragging ? "" : "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"}
              style={{
                transform: `translateX(${dragX}px)`,
                opacity: 1 - Math.min(Math.abs(dragX) / MAX_DRAG, 1) * 0.35,
              }}
            >
              {children}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {NAV_ITEMS.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  `h-1.5 rounded-full transition-all ${
                    isActive ? "w-4 bg-rose-400 dark:bg-orange-400" : "w-1.5 bg-neutral-700"
                  }`
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
