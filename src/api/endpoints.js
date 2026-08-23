// 백엔드 경로 상수. 경로가 바뀌면 여기만 고친다.
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085";
export const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8085/ws";
export const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? "1";

export const endpoints = {
  demoState: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/state`,
  demoAdvance: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/advance`,
  demoReset: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/reset`,
  demoTimeline: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/timeline`,
  demoJobs: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/jobs`,
  latestPrediction: (userId = DEMO_USER_ID) => `${API_BASE}/api/predictions/users/${userId}/latest`,
};

// 백엔드가 push 하는 웹소켓 토픽. 백엔드 app.ws.prediction-topic-prefix 와 반드시 일치해야 한다.
export const predictionTopic = (userId = DEMO_USER_ID) => `/topic/prediction/${userId}`;
