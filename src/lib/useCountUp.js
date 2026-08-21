import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

// 하루 넘기기로 값이 바뀔 때 "조용히" 바뀌지 않도록 숫자를 세면서 올라가게 한다.
// disabled(자동재생 4배속 등)일 때는 duration을 0으로 줘서 애니메이션 없이 즉시 반영한다.
// 항상 animate()의 onUpdate 콜백으로만 setState하므로(useEffect 본문에서 직접 호출하지 않음)
// "effect 안에서 동기적으로 setState" 린트 규칙에 걸리지 않는다.
export function useCountUp(value, { duration = 0.25, decimals = 0, disabled = false } = {}) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const from = prevValue.current;
    prevValue.current = value;
    const controls = animate(from, value, {
      duration: disabled ? 0 : duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Number(v.toFixed(decimals))),
    });
    return () => controls.stop();
  }, [value, disabled, duration, decimals]);

  return display;
}
