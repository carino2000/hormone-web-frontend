import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { WS_URL, predictionTopic } from "../api/endpoints";
import { useSimulationStore } from "../state/simulationStore";

// 백엔드가 예측 결과를 /topic/prediction/{userId} 로 push 한다. 그걸 받는 훅.
//
// App.jsx 에서 한 번만 마운트한다. 화면마다 각자 연결하면 같은 이벤트를 여러 번 처리한다.
//
// 백엔드 WebSocketConfig 가 SockJS 를 안 쓰므로 네이티브 WebSocket 으로 충분하다
// (sockjs-client 불필요). 백엔드가 나중에 SockJS 를 켜면 여기도 같이 바꿔야 한다.
export function usePredictionSocket() {
  useEffect(() => {
    useSimulationStore.getState().setWsStatus("connecting");

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // stompjs 기본 로그가 매우 시끄럽다. 발표 중 콘솔을 깨끗하게 유지한다.
      debug: () => {},
      onConnect: () => {
        useSimulationStore.getState().setWsStatus("connected");
        client.subscribe(predictionTopic(), (message) => {
          try {
            useSimulationStore.getState().onPredictionEvent(JSON.parse(message.body));
          } catch {
            // 파싱 실패해도 타임라인 재조회로 복구되므로 조용히 넘어간다
          }
        });
      },
      onWebSocketClose: () => useSimulationStore.getState().setWsStatus("disconnected"),
      onStompError: () => useSimulationStore.getState().setWsStatus("disconnected"),
    });

    client.activate();
    return () => {
      client.deactivate();
      useSimulationStore.getState().setWsStatus("disconnected");
    };
  }, []);
}
