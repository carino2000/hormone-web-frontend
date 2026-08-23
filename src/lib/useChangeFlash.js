import { useEffect, useState } from "react";

// 하루 넘기기로 카드 값이 바뀐 순간을 짧게 하이라이트하기 위한 훅.
// watchValue가 이전 렌더와 달라지면 duration(ms) 동안 true를 반환한다.
// disabled(자동재생 4배속 등)면 항상 false — 겹친 플래시로 지저분해지는 것을 막는다.
// prop 변화에 "즉시" 반응해야 하는 부분은 렌더링 중에 조정하고(React 권장 패턴),
// 진짜 side effect인 타이머(일정 시간 뒤 꺼짐)만 useEffect가 담당한다.
export function useChangeFlash(watchValue, { duration = 900, disabled = false } = {}) {
  const [prevWatchValue, setPrevWatchValue] = useState(watchValue);
  const [flash, setFlash] = useState(false);

  if (watchValue !== prevWatchValue) {
    setPrevWatchValue(watchValue);
    if (!disabled) setFlash(true);
  }

  useEffect(() => {
    if (!flash) return undefined;
    const timeout = setTimeout(() => setFlash(false), duration);
    return () => clearTimeout(timeout);
  }, [flash, duration]);

  return flash;
}
