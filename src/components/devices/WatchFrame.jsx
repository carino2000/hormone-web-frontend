import { useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/navItems";

const SWIPE_THRESHOLD = 36; // 이 이상 끌어야 페이지 전환으로 인정
const FREE_DRAG = 70; // 이 구간까지는 손가락/마우스를 그대로 따라간다
const MAX_DRAG = 110; // 그 이상은 고무줄처럼 저항이 걸리며 절대 이 값을 넘지 않는다

// 스크린 규격 (가이드 §5). 324/396 = 0.818 — Apple Watch 45mm 과 같은 종횡비다.
// ★ 이 비율을 바꾸지 말 것. 정사각에 가까워지면 워치가 아니라 아이팟처럼 보인다.
const SCREEN_W = 324;
const SCREEN_H = 396;
// 베젤. 가이드 원안은 16px 인데 실물보다 두꺼워 보여서 9px 로 줄였다.
// 케이스 라운드도 같이 줄여야 한다 — 스크린 라운드(68) + 베젤 이어야 테두리 폭이
// 모서리에서도 일정하게 보인다. 안 맞추면 모서리만 두꺼워 보인다.
const BEZEL = 9;
const CASE_RADIUS = 68 + BEZEL;

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

/**
 * 워치 목업 프레임.
 *
 * watchOS/Wear OS 의 "페이지 점(dot) 내비게이션" 관례를 따른다 — 화면 하나에 화면 하나의
 * 정보만 담고, 좌우로 넘기는 페이지들 사이를 화면 아래쪽의 작은 점으로 표시/이동한다.
 * 점을 눌러도 되고, 실제 워치처럼 화면을 좌우로 끌어서 넘길 수도 있다.
 *
 * <b>★ 케이스는 실버 스테인리스다</b>(가이드 §5). 어두운 케이스보다 검정 스크린과
 * 대비가 강해서 화면이 또렷해 보인다.
 *
 * <b>★ 스크린 안은 라이트/다크 토글과 무관하게 항상 검정</b>이다 — 실제 워치가 그렇다.
 * 그래서 안쪽에 `.watch-view` 를 걸어 토큰 스코프를 연다(index.css 참고).
 *
 * <b>★ 내부 패딩을 자식에게 강요하지 않는다.</b> 판정 밴드가 좌우 여백 0 의 풀블리드라
 * 프레임이 padding 을 주면 그 형태가 깨진다. 좌우 여백은 각 화면이 알아서 넣는다.
 */
export default function WatchFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dragState = useRef({ startX: 0, dragging: false });
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pageIndex = currentPageIndex(location.pathname);

  const go = (delta) => {
    const next = pageIndex + delta;
    if (next >= 0 && next < NAV_ITEMS.length) navigate(NAV_ITEMS[next].to);
  };

  const handlePointerDown = (e) => {
    dragState.current = { startX: e.clientX, dragging: true };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.dragging) return;
    setDragX(withRubberBand(e.clientX - dragState.current.startX));
  };

  const endDrag = (e) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    dragState.current.dragging = false;
    setIsDragging(false);
    setDragX(0);
    if (delta <= -SWIPE_THRESHOLD) go(1);
    else if (delta >= SWIPE_THRESHOLD) go(-1);
  };

  return (
    <div
      className="relative mx-auto"
      style={{ width: SCREEN_W + BEZEL * 2, height: SCREEN_H + BEZEL * 2 }}
    >
      {/* 디지털 크라운 / 사이드 버튼 — 케이스 옆면에 튀어나온 것처럼 절대 위치로 붙인다.
          크라운 표면의 가는 줄무늬는 동전 옆면 같은 손잡이 돌기 질감이다. */}
      <span
        className="absolute right-[-5px] top-[118px] h-11 w-[10px] rounded-[4px]"
        style={{
          background:
            "repeating-linear-gradient(180deg,#D8D8DC 0 2px,#8E8E94 2px 4px)",
        }}
        aria-hidden
      />
      <span
        className="absolute right-[-2px] top-[188px] h-16 w-[6px] rounded-[3px]"
        style={{ background: "#B4B4BA" }}
        aria-hidden
      />

      <div
        className="h-full w-full"
        style={{
          borderRadius: CASE_RADIUS,
          padding: BEZEL,
          background:
            "linear-gradient(150deg,#E8E8EA 0%,#9A9AA0 40%,#C8C8CE 62%,#6E6E76 100%)",
          boxShadow:
            "0 26px 64px -14px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.5)",
        }}
      >
        <div
          className="watch-view relative flex h-full w-full flex-col overflow-hidden"
          style={{ borderRadius: 68, background: "var(--w-bg)" }}
          role="tabpanel"
          aria-label={NAV_ITEMS[pageIndex]?.label}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            else if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <div
            className="flex w-full flex-1 touch-pan-y select-none flex-col overflow-hidden"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className={`flex h-full w-full flex-col ${
                isDragging
                  ? ""
                  : "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              }`}
              style={{
                transform: `translateX(${dragX}px)`,
                opacity: 1 - Math.min(Math.abs(dragX) / MAX_DRAG, 1) * 0.35,
              }}
            >
              {children}
            </div>
          </div>

          {/* 페이지 닷. 하단 라운드에 안 잘리도록 34px 안쪽에 둔다(가이드 §5 세이프 에어리어) */}
          <div className="flex shrink-0 items-center justify-center gap-1.5 pb-5 pt-1.5">
            {NAV_ITEMS.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                role="tab"
                aria-label={label}
                className={({ isActive }) =>
                  `h-1.5 rounded-full transition-all ${isActive ? "w-4" : "w-1.5"}`
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--w-amber)" : "var(--w-ring-track)",
                })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
