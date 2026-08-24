import { create } from "zustand";
import { endpoints } from "../api/endpoints";
import { httpPost } from "../api/http";
import { generateAdvice } from "../api";
import {
  DEFAULT_COLD_START_DAYS,
  DEFAULT_TOTAL_DAYS,
  ensureLoaded,
  getMeta,
  invalidateCache,
} from "../data/simulationSource";

const ADVICE_TOGGLE_KEY = "hormone-web.adviceEnabled";

/**
 * 토글 상태를 localStorage 에 남긴다. 새로고침해도 유지돼야 시연 중에
 * "켰는데 왜 꺼져 있지" 하는 일이 없다. 기본값은 꺼짐 — 켜는 순간 과금이 시작되므로
 * 사용자가 명시적으로 켜야 한다.
 */
function readAdviceToggle() {
  try {
    return localStorage.getItem(ADVICE_TOGGLE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeAdviceToggle(value) {
  try {
    localStorage.setItem(ADVICE_TOGGLE_KEY, String(value));
  } catch {
    /* 사파리 프라이빗 등에서 막힐 수 있다. 토글은 그래도 동작한다 */
  }
}

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

  /**
   * 예측이 실패한 일차와 사유. {day, message}
   *
   * ★ 내장 Mock 을 제거해서 폴백이 없다. 파이썬이 끊기면 예측이 그냥 안 나오는데,
   *   이걸 안 들고 있으면 화면이 pending("계산 중")으로 영원히 남는다.
   *   실패는 실패라고 보여야 시연 중에 원인을 찾을 수 있다.
   */
  predictionError: null,

  // -------------------------------------------------------------------
  // 오늘의 조언 (Claude API)
  // -------------------------------------------------------------------
  /** 토글. 켜져 있으면 하루 넘길 때마다 자동으로 조언을 받는다. localStorage 에 남는다. */
  adviceEnabled: readAdviceToggle(),
  adviceLoading: false,
  adviceError: null,
  /** 조언이 갱신될 때마다 올린다. 조언 탭이 이걸 구독해서 다시 읽는다. */
  adviceRevision: 0,

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
        predictionError: null,
        dataRevision: get().dataRevision + 1,
        isPlaying: result.status === "done" ? false : get().isPlaying,
      });

      // 예측이 없는 콜드스타트 구간은 WebSocket 이벤트가 안 오므로 여기서 건다.
      // 예측 구간은 onPredictionEvent 에서 건다 — 조언이 오늘 예측을 참고해야 해서
      // 예측이 도착한 뒤에 불러야 한다.
      const day = get().currentDay;
      if (day > 0 && day < get().coldStartDays) {
        get().requestAdvice({ auto: true });
      }
    } catch (error) {
      set({ loadError: error?.message ?? "백엔드 응답 없음", isPlaying: false });
    } finally {
      set({ isAdvancing: false });
    }
  },

  setAdviceEnabled: (adviceEnabled) => {
    writeAdviceToggle(adviceEnabled);
    set({ adviceEnabled, adviceError: null });
  },

  /**
   * 조언 요청. 화면을 막지 않는다 — 첫 호출이 15~20초 걸린다.
   *
   * ★ 자동재생 중에는 자동 호출을 건너뛴다(auto=true). 4x 로 90일을 돌리면
   *   Claude 를 70번 부르게 되고, 응답이 진행 속도를 못 따라간다.
   *   수동 버튼(auto=false)은 자동재생 중에도 동작한다.
   */
  requestAdvice: async ({ force = false, auto = false } = {}) => {
    const s = get();
    if (auto && !s.adviceEnabled) return;
    if (auto && s.isPlaying) return;
    if (s.adviceLoading) return;
    if (s.currentDay < 1) return;

    set({ adviceLoading: true, adviceError: null });
    try {
      await generateAdvice({ force });
      set({ adviceRevision: get().adviceRevision + 1 });
    } catch (error) {
      set({ adviceError: error?.message ?? "조언을 받지 못했습니다" });
    } finally {
      set({ adviceLoading: false });
    }
  },

  /** Day 0 으로 초기화. 백엔드의 수집 데이터와 예측을 지운다(시드는 보존). */
  reset: async () => {
    set({ isAdvancing: true, isPlaying: false });
    try {
      await httpPost(endpoints.demoReset());
      invalidateCache();
      await ensureLoaded();
      set({
        currentDay: 0,
        loadError: null,
        dataRevision: get().dataRevision + 1,
        adviceError: null,
        predictionError: null,
        adviceRevision: get().adviceRevision + 1,
      });
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
      const failed = event.type === "PREDICTION_FAILED";
      set({
        currentDay: event.day ?? get().currentDay,
        dataRevision: get().dataRevision + 1,
        predictionError: failed
          ? {
              day: event.day ?? get().currentDay,
              message: event.error?.message ?? "예측 서버에 연결할 수 없습니다",
            }
          : null,
      });

      // 조언은 오늘 예측을 참고하므로 예측이 도착한 뒤에 부른다.
      // 실패한 날은 부르지 않는다 — 참고할 예측이 없다.
      if (!failed) {
        get().requestAdvice({ auto: true });
      }
    } catch (error) {
      set({ loadError: error?.message ?? "백엔드 응답 없음" });
    }
  },
}));
