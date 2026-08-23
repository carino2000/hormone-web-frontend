import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

// 하루 넘기기로 값이 바뀔 때 "조용히" 바뀌지 않도록 숫자를 세면서 올라가게 한다.
// disabled(자동재생 4배속 등)일 때는 duration을 0으로 줘서 애니메이션 없이 즉시 반영한다.
//
// ★ StrictMode 주의 (실제로 났던 버그)
// 예전 구현은 effect **본문에서** prevValue.current = value 로 시작점을 갱신했다.
// StrictMode 는 effect 를 [실행 → cleanup → 재실행] 하므로:
//   1회차: from = 이전값 -> animate(이전값, 새값) 시작, prevValue 를 새값으로 덮어씀
//   cleanup: 애니메이션 중단
//   2회차: from = 새값(이미 덮어씀) -> animate(새값, 새값) -> 변화가 없어 onUpdate 미호출
// 결과적으로 표시값이 **한 단계 뒤처진 채 멈춘다.** 하루를 넘겨도 어제 값이 보였다.
//
// 그래서 시작점(displayRef)은 effect 본문에서 절대 건드리지 않고,
// onUpdate/onComplete 콜백으로만 전진시킨다. 그러면 effect 가 몇 번 재실행돼도
// 시작점이 늘 "지금 화면에 그려진 값"이라 목표값을 향해 정상 동작한다.
//
// onComplete 로 최종값을 한 번 더 못 박는 이유: duration 0(disabled) 이거나
// from === value 인 경우 onUpdate 가 아예 안 불릴 수 있어서다.
// 둘 다 콜백이라 "effect 안에서 동기적으로 setState" 린트 규칙에도 걸리지 않는다.
export function useCountUp(value, { duration = 0.25, decimals = 0, disabled = false } = {}) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return undefined;
    }
    const from = typeof displayRef.current === "number" ? displayRef.current : value;

    const controls = animate(from, value, {
      duration: disabled ? 0 : duration,
      ease: "easeOut",
      onUpdate: (v) => {
        displayRef.current = v;
        setDisplay(Number(v.toFixed(decimals)));
      },
      onComplete: () => {
        displayRef.current = value;
        setDisplay(Number(value.toFixed(decimals)));
      },
    });
    return () => controls.stop();
  }, [value, disabled, duration, decimals]);

  return display;
}
