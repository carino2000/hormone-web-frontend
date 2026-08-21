import { create } from "zustand";
import simulationFixture from "../mocks/simulationDays.json";

export const STEP_MS = 800; // 1x 기준 한 스텝(하루)의 자동재생 간격
export const COLD_START_DAYS = simulationFixture.coldStartDays;
export const TOTAL_DAYS = simulationFixture.totalDays;

// 시뮬레이션 일차는 탭(홈/예측상세/달력)과 디바이스 뷰(PC/모바일/워치) 전환에도 유지돼야
// 하는 전역 상태다. 컴포넌트 로컬 state로 두면 탭을 옮기는 순간 Day 1로 초기화된다 —
// 데모 시뮬레이터 지시서의 "하지 말 것" 1순위.
export const useSimulationStore = create((set, get) => ({
  currentDay: 1,
  totalDays: TOTAL_DAYS,
  isPlaying: false,
  speed: 1,
  dataSource: "mock", // 'mock' | 'api' — 화면은 이 값을 직접 안 보고 src/data/simulationSource를 거친다

  next: () => {
    const { currentDay, totalDays } = get();
    if (currentDay >= totalDays) {
      // 마지막 날에서는 자동재생만 멈춘다. Day 1로 되감지 않는다 —
      // 발표 중 화면이 갑자기 리셋되면 안 된다는 지시서 원칙.
      set({ isPlaying: false });
      return;
    }
    set({ currentDay: currentDay + 1 });
  },

  prev: () => set((s) => ({ currentDay: Math.max(1, s.currentDay - 1), isPlaying: false })),

  jumpTo: (day) =>
    set((s) => ({
      currentDay: Math.min(s.totalDays, Math.max(1, Math.round(day))),
      isPlaying: false, // 스크러버 조작 중에는 자동재생을 멈춰서 값이 튀지 않게 한다
    })),

  reset: () => set({ currentDay: 1, isPlaying: false }),

  play: () =>
    set((s) => (s.currentDay >= s.totalDays ? s : { isPlaying: true })),

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const { isPlaying, currentDay, totalDays } = get();
    if (isPlaying) {
      set({ isPlaying: false });
    } else if (currentDay < totalDays) {
      set({ isPlaying: true });
    }
  },

  setSpeed: (speed) => set({ speed }),

  setDataSource: (dataSource) => set({ dataSource }),
}));
