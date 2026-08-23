// 얇은 fetch 래퍼.
//
// 원칙 두 가지:
//  1) 반드시 타임아웃을 건다 — 백엔드가 죽으면 발표 중 화면이 영원히 멈춘다.
//  2) 재시도하지 않는다 — advance 가 두 번 나가면 하루가 두 번 넘어간다.

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request(url, { method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      // 백엔드 GlobalExceptionHandler 가 {code, message, timestamp} 로 통일해서 준다
      throw new ApiError(data?.code ?? "HTTP_ERROR", data?.message ?? `요청 실패 (${response.status})`, response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") {
      throw new ApiError("TIMEOUT", `응답이 없습니다 (${timeoutMs / 1000}초 초과)`, 0);
    }
    // fetch 자체가 실패 = 백엔드가 안 떠 있거나 CORS 차단
    throw new ApiError("NETWORK_ERROR", "백엔드에 연결할 수 없습니다", 0);
  } finally {
    clearTimeout(timer);
  }
}

export const httpGet = (url, options) => request(url, { ...options, method: "GET" });
export const httpPost = (url, body, options) => request(url, { ...options, method: "POST", body });
