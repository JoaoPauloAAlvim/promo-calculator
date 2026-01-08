export type ApiError = {
  message: string;
  status: number;
  payload?: any;
};

export class ApiException extends Error {
  status: number;
  payload?: any;

  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.payload = payload;
  }
}

type ApiOptions = RequestInit & {
  allowEmptyJson?: boolean;
};

function isAuthEndpoint(url: string) {
  return (
    url.startsWith("/api/login") ||
    url.startsWith("/api/logout")
  );
}

export async function api<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const res = await fetch(url, options);

  if (res.status === 401 && typeof window !== "undefined" && !isAuthEndpoint(url)) {
    try {
      sessionStorage.setItem("simulador_session_expired", "1");
    } catch {}

    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }

    return new Promise<T>(() => {});
  }

  let payload: any = null;
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    payload = await res.json().catch(() => null);
  } else {
    payload = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (payload && (payload.error || payload.erro || payload.message)) ||
      `Erro na API (${res.status})`;
    throw new ApiException(message, res.status, payload);
  }

  if (payload === "" || payload === null) {
    if (options.allowEmptyJson) return payload as T;
  }

  return payload as T;
}


