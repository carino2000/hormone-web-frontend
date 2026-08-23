import { useEffect } from "react";
import { STEP_MS, useSimulationStore } from "./simulationStore";

// App.jsx 에서 한 번만 마운트한다. 디바이스 뷰/탭을 얼마나 옮겨 다니든 재생 타이머는
// 이 훅 하나가 전역으로 담당한다 — 화면마다 각자 setInterval 을 만들면 배속이 중첩된다.
//
// 한 스텝마다 실제 HTTP 요청 + 예측이 돈다. 너무 촘촘하면 백엔드가 밀려서 시연이 엉킨다.
// store.next() 가 isAdvancing 으로 중복 발사를 막지만, 간격 자체도 여유를 둔다.
export function useSimulationAutoplay() {
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const speed = useSimulationStore((s) => s.speed);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = Math.max(600, STEP_MS / speed);
    const id = setInterval(() => {
      useSimulationStore.getState().next();
    }, interval);
    return () => clearInterval(id);
  }, [isPlaying, speed]);
}
