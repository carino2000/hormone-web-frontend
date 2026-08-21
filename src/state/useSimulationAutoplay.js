import { useEffect } from "react";
import { STEP_MS, useSimulationStore } from "./simulationStore";

// App.jsx에서 한 번만 마운트한다. 디바이스 뷰/탭을 얼마나 옮겨 다니든 재생 타이머는
// 이 훅 하나가 전역으로 담당한다 — 화면마다 각자 setInterval을 만들면 배속이 중첩된다.
export function useSimulationAutoplay() {
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const speed = useSimulationStore((s) => s.speed);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const id = setInterval(() => {
      useSimulationStore.getState().next();
    }, STEP_MS / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed]);
}
