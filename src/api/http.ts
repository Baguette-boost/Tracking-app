// HTTP 클라이언트 — fetch 래퍼. design/api-spec.md "인증·에러 공통 규약"
// 베이스 URL은 환경변수 EXPO_PUBLIC_API_URL 로 주입.

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.safetrack.example/v1';

// 토큰은 객체 홀더에 저장 — let 재할당보다 모듈 경계에서 안전하게 공유됨.
const authState: { token: string | null } = { token: null };

export function setAccessToken(token: string | null) {
  authState.token = token;
}
export function getAccessToken(): string | null {
  return authState.token;
}

export interface ApiError {
  code: string;
  message: string;
}

export class HttpError extends Error {
  constructor(public status: number, public body: ApiError) {
    super(body.message);
    this.name = 'HttpError';
  }
}

type QueryValue = string | number | boolean | undefined;
export type Query = Record<string, QueryValue>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(BASE_URL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const token = authState.token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const bodyStr = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;

  // ===== 요청 로그 (헤더/바디/길이 전부) =====
  console.log(`[http] → ${method} ${url}`);
  console.log(`[http]   headers: ${JSON.stringify(headers)}`);
  console.log(`[http]   auth: ${token ? `Bearer ${token}` : '(none)'}`);
  if (bodyStr !== undefined) console.log(`[http]   body(len ${bodyStr.length}): ${bodyStr}`);

  const res = await fetch(url, { method, headers, body: bodyStr, signal: opts.signal });

  // 응답 본문은 한 번만 읽을 수 있으므로 먼저 텍스트로 확보
  const rawText = await res.text().catch(() => '');

  // ===== 응답 로그 =====
  console.log(`[http] ← ${res.status} ${method} ${url} (resp len ${rawText.length})`);
  console.log(`[http]   resp: ${rawText.slice(0, 800)}`);

  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`;
    try {
      const json = JSON.parse(rawText);
      if (typeof json?.detail === 'string') message = json.detail;
      else if (Array.isArray(json?.detail))
        message = json.detail.map((d: any) => d?.msg ?? '').join(', ');
      else if (json?.error?.message) message = json.error.message;
      else if (json?.message) message = json.message;
    } catch {
      if (rawText) message = rawText.slice(0, 200);
    }
    throw new HttpError(res.status, {
      code: String(res.status),
      message: `[${res.status}] ${message}`,
    });
  }

  if (res.status === 204 || !rawText) return undefined as T;
  return JSON.parse(rawText) as T;
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
