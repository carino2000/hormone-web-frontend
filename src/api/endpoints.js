// 백엔드 경로 상수. 경로가 바뀌면 여기만 고친다.
//
// ★ 기본값이 <b>같은 출처(상대 경로)</b>다. Vite 가 /api 와 /ws 를 백엔드로 넘겨준다
//   (vite.config.js 의 server.proxy). 예전엔 http://localhost:8085 를 직접 박아뒀는데,
//   Cloudflare Tunnel 로 팀원에게 공유하면 그 주소가 <b>팀원의</b> localhost 를 가리켜서
//   아무것도 안 됐다. 게다가 HTTPS 페이지에서 http:// 호출은 브라우저가 막는다.
//
//   상대 경로로 두면 로컬이든 터널이든 같은 코드로 돌아간다.
//   백엔드를 다른 호스트에 따로 띄울 때만 VITE_API_BASE_URL 로 덮는다.
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// 웹소켓도 같은 출처로 붙는다. https 로 열렸으면 wss 여야 한다 —
// https 페이지에서 ws:// 는 브라우저가 차단한다.
export const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;
export const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? "1";

export const endpoints = {
  demoState: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/state`,
  demoAdvance: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/advance`,
  demoReset: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/reset`,
  demoTimeline: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/timeline`,
  demoJobs: (userId = DEMO_USER_ID) => `${API_BASE}/api/demo/users/${userId}/jobs`,
  latestPrediction: (userId = DEMO_USER_ID) => `${API_BASE}/api/predictions/users/${userId}/latest`,

  // 오늘의 조언 (Claude API)
  adviceStatus: () => `${API_BASE}/api/advice/status`,
  adviceList: (userId = DEMO_USER_ID) => `${API_BASE}/api/advice/users/${userId}`,
  adviceGenerate: (userId = DEMO_USER_ID, force = false) =>
    `${API_BASE}/api/advice/users/${userId}?force=${force}`,
};

// 백엔드가 push 하는 웹소켓 토픽. 백엔드 app.ws.prediction-topic-prefix 와 반드시 일치해야 한다.
export const predictionTopic = (userId = DEMO_USER_ID) => `/topic/prediction/${userId}`;
