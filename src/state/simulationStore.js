import { create } from "zustand";
import { endpoints } from "../api/endpoints";
import { httpPost } from "../api/http";
import {
  DEFAULT_COLD_START_DAYS,
  DEFAULT_TOTAL_DAYS,
  ensureLoaded,
  getMeta,
  invalidateCache,
} from "../data/simulationSource";

export const STEP_MS = 2000; // 자동재생 한 스텝. 매 스텝이 실제 백엔드 요청 + 예측이라 여유를 둔다

// 시뮬레이션 일차는 탭(홈/예측상세/달력)과 디바이스 뷰(PC/모바일/워치) 전환에도 유지돼야
// 하는 전역 상태다. 컴포넌트 로컬 state 로 두면 탭을 옮기는 순간 초기화된다.
//
// ★ 데이터 소스는 백엔드 하나뿐이다. 로컬 목업은 제거했다(simulationSource.js 주석 참고).
export const useSimulationStore = create((set, get) => ({
  // Day 0 = 아직 하룻밤도 지나지 않은 시작 시점. 웨어러블 데이터가 아직 없다.
  // 수면·야간 피부온도·HRV 는 밤이 지나야 확정되므로 진입 즉시 값이 있으면 앞뒤가 안 맞는다.
  currentDay: 0,
  totalDays: DEFAULT_TOTAL_DAYS,
  coldStartDays: DEFAULT_COLD_START_DAYS,

  isPlaying: false,
  speed: 1,

  wsStatus: "disconnected", // 'disconnected' | 'connecting' | 'connected'
  isAdvancing: false, // 요청 진행 중 (버튼 중복 발사 방지)
  loadError: null, // 백엔드에 못 붙었을 때의 사유. 화면이 이걸 그대로 보여준다

  // 화면 갱신 트리거.
  // 예측은 비동기라 advance 직후에는 아직 결과가 없고, 잠시 뒤 WebSocket 으로 도착한다.
  // 그때 currentDay 는 이미 같은 값이라 zustand 가 변경으로 안 보고 리렌더를 안 건다.
  dataRevision: 0,

  // -------------------------------------------------------------------
  // 초기 적재
  // -------------------------------------------------------------------
  /** App 마운트 시 한 번. 백엔드 타임라인을 받아 현재 일차까지 복원한다. */
  init: async () => {
    invalidateCache();
    try {
      const timeline = await ensureLoaded();
      set({
        currentDay: timeline?.currentDay ?? 0,
        totalDays: timeline?.totalDays ?? DEFAULT_TOTAL_DAYS,
        coldStartDays: timeline?.coldStartDays ?? DEFAULT_COLD_START_DAYS,
        loadError: null,
        dataRevision: get().dataRevision + 1,
      });
    } catch (error) {
      set({ loadError: error?.message ?? "백엔드에 연결할 수 없습니다", isPlaying: false });
    }
  },

  // -------------------------------------------------------------------
  // 진행
  // -------------------------------------------------------------------
  /** 하루 넘기기. 백엔드가 진실이므로 로컬에서 일차를 올리지 않는다. */
  next: async () => {
    if (get().isAdvancing) return; // 버튼 연타 / 자동재생 중첩 방지
    if (get().currentDay >= get().totalDays) {
      set({ isPlaying: false });
      return;
    }

    set({ isAdvancing: true });
    try {
      const result = await httpPost(endpoints.demoAdvance());
      invalidateCache();
      await ensureLoaded();
      const meta = getMeta();
      set({
        currentDay: result.day ?? get().currentDay,
        totalDays: meta?.totalDays ?? get().totalDays,
        coldStartDays: meta?.coldStartDays ?? get().coldStartDays,
        loadError: null,
        dataRevision: get().dataRevision + 1,
        isPlaying: result.status === "done" ? false : get().isPlaying,
      });
    } catch (error) {
      set({ loadError: error?.message ?? "백엔드 응답 없음", isPlaying: false });
    } finally {
      set({ isAdvancing: false });
    }
  },

  /** Day 0 으로 초기화. 백엔드의 수집 데이터와 예측을 지운다(시드는 보존). */
  reset: async () => {
    set({ isAdvancing: true, isPlaying: false });
    try {
      await httpPost(endpoints.demoReset());
      invalidateCache();
      await ensureLoaded();
      set({ currentDay: 0, loadError: null, dataRevision: get().dataRevision + 1 });
    } catch (error) {
      set({ loadError: error?.message ?? "백엔드 응답 없음" });
    } finally {
      set({ isAdvancing: false });
    }
  },

  play: () => set((s) => (s.currentDay >= s.totalDays ? s : { isPlaying: true })),
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
  setWsStatus: (wsStatus) => set({ wsStatus }),
  clearError: () => set({ loadError: null }),

  /** 웹소켓으로 예측 완료 알림이 오면 타임라인을 다시 받아 화면을 갱신한다. */
  onPredictionEvent: async (event) => {
    if (event?.type !== "PREDICTION_READY" && event?.type !== "PREDICTION_FAILED") return;

    invalidateCache();
    try {
      await ensureLoaded();
      // dataRevision 을 올려야 구독 컴포넌트가 refetch 한다.
      // currentDay 만 넣으면 값이 같아서 zustand 가 변경으로 안 본다.
      set({ currentDay: event.day ?? get().currentDay, dataRevision: get().dataRevision + 1 });
    } catch (error) {
      set({ loadError: error?.message ?? "백엔드 응답 없음" });
    }
  },
}));
