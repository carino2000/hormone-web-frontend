import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 백엔드 주소. 터널을 쓰든 로컬이든 "브라우저"가 아니라 <b>Vite 서버</b>가 여기로 붙는다.
// 백엔드를 다른 포트/호스트에 띄웠다면 BACKEND_ORIGIN 환경변수로 덮는다.
const BACKEND = globalThis.process?.env?.BACKEND_ORIGIN ?? 'http://localhost:8085'

/**
 * ★ 프록시가 백엔드로 넘길 때 <b>Origin 헤더를 백엔드 자신의 주소로 바꾼다.</b>
 *
 * 왜 필요한가: 터널로 열면 브라우저가 `Origin: https://xxx.trycloudflare.com` 을 보낸다.
 * Vite 의 `changeOrigin: true` 는 이름과 달리 <b>Host 만</b> 바꾸고 Origin 은 그대로 넘긴다.
 * 백엔드 CORS 허용 목록에는 localhost 밖에 없으니 스프링이 <b>403</b> 으로 거절한다.
 *
 * 실측: Origin 없이 요청하면 101(성공), Origin 을 붙이면 403 이었다.
 * 브라우저는 웹소켓과 POST 에 <b>항상</b> Origin 을 붙이므로 화면에서는
 * "연결 끊김" + 하루 넘기기 실패로 나타난다.
 *
 * 여기서 바꿔주면 <b>백엔드 설정을 건드리지 않고</b> 어떤 터널 주소에서도 동작한다.
 * (터널 URL 은 띄울 때마다 바뀌므로 허용 목록에 박아 두는 방식은 유지가 안 된다)
 */
const rewriteOrigin = (proxy) => {
  proxy.on('proxyReq', (proxyReq) => proxyReq.setHeader('origin', BACKEND))
  proxy.on('proxyReqWs', (proxyReq) => proxyReq.setHeader('origin', BACKEND))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // ★ 포트를 고정한다. Vite 는 기본적으로 포트가 쓰이면 <b>말없이 다음 포트로</b> 옮겨가는데,
    //   Cloudflare Tunnel 은 `--url http://localhost:5174` 처럼 포트를 박아서 띄우므로
    //   Vite 가 5175 로 밀리면 터널이 조용히 죽는다(팀원에게는 그냥 "안 열려요" 로 보인다).
    //   strictPort 면 포트가 이미 쓰일 때 옮겨가는 대신 <b>에러를 내고 멈춘다</b> — 바로 알아챌 수 있다.
    //   (5173 은 이 PC 에서 Windows IP Helper 서비스가 점유 중이라 5174 를 쓴다)
    port: 5174,
    strictPort: true,

    // Cloudflare Tunnel 등 외부 임시 도메인에서 접속 허용
    allowedHosts: true,

    // ★ /api 와 /ws 를 Vite 가 백엔드로 넘긴다.
    //
    // 이게 없으면 브라우저가 직접 http://localhost:8085 를 부르는데, 터널로 공유했을 때
    // 세 가지가 한꺼번에 깨진다:
    //   1) 팀원의 localhost 를 찾는다 — 우리 백엔드가 아니다
    //   2) HTTPS 페이지에서 http:// 호출이라 브라우저가 mixed content 로 막는다
    //   3) 백엔드 CORS 허용 목록에 터널 도메인이 없어서 403
    //
    // 프록시를 두면 브라우저가 보기에 API 도 웹소켓도 <b>같은 출처</b>라
    // 위 셋이 전부 사라진다. 터널도 하나만 있으면 된다.
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true, configure: rewriteOrigin },
      // ws:true 가 있어야 웹소켓 업그레이드가 통과된다. 없으면 예측 결과가
      // 실시간으로 안 오고 화면이 "계산 중" 에서 멈춘 것처럼 보인다.
      '/ws': { target: BACKEND, changeOrigin: true, ws: true, configure: rewriteOrigin },
    },
  },
})
