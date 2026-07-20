// Server-only PortOne V2 REST client. Do NOT import from client-reachable files.
// Reads PORTONE_API_SECRET at call time (env is injected per request on Workers).

const PORTONE_API_BASE = "https://api.portone.io";

function getApiSecret(): string {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    throw new Error(
      "PORTONE_API_SECRET is not configured. Add it in project secrets.",
    );
  }
  return secret;
}

export type PortonePayment = {
  status:
    | "READY"
    | "PENDING"
    | "VIRTUAL_ACCOUNT_ISSUED"
    | "PAID"
    | "FAILED"
    | "PARTIAL_CANCELLED"
    | "CANCELLED";
  id: string;
  transactionId?: string;
  merchantId?: string;
  storeId?: string;
  method?: unknown;
  channel?: { key?: string; type?: string; pgProvider?: string };
  amount?: { total: number; paid?: number; cancelled?: number };
  currency?: string;
  customer?: unknown;
  orderName?: string;
  paidAt?: string;
  failedAt?: string;
  failure?: { message?: string };
};

export class PortonePaymentPendingError extends Error {
  constructor(paymentId: string) {
    super(`Payment lookup is still pending: ${paymentId}`);
    this.name = "PortonePaymentPendingError";
  }
}

export async function getPortonePayment(
  paymentId: string,
): Promise<PortonePayment> {
  // 💡 모바일 리다이렉트 도중 유실되거나 공백이 포함될 수 있는 paymentId 문자열을 안전하게 정제합니다.
  const cleanPaymentId = String(paymentId ?? "").trim();
  if (!cleanPaymentId) {
    throw new Error("PortOne getPayment failed: paymentId is empty or invalid.");
  }

  const url = new URL(
    `${PORTONE_API_BASE}/payments/${encodeURIComponent(cleanPaymentId)}`,
  );

  try {
    // Keep each verification request short. The caller owns the polling cadence;
    // retrying here as well multiplies the wait and can leave the checkout UI
    // blocked for minutes.
    const res = await fetch(url.toString(), {
      headers: { 
        Authorization: `PortOne ${getApiSecret()}`,
        "Accept": "application/json"
      },
    });

    if (res.ok) {
      return (await res.json()) as PortonePayment;
    }

    const body = await res.text();
    if (res.status === 404 && body.includes("PAYMENT_NOT_FOUND")) {
      throw new PortonePaymentPendingError(cleanPaymentId);
    }
    
    throw new Error(`PortOne getPayment failed [${res.status}]: ${body}`);
  } catch (error: any) {
    // 네트워크 단절이나 엣지 컴퓨팅 캐싱 충돌 시 상위 라우터에서 복구할 수 있도록 에러를 명확히 래핑합니다.
    if (error instanceof PortonePaymentPendingError) throw error;
    console.error("PortOne API Fetch Error:", error);
    throw new Error(`PortOne REST Client Fetch Network Error: ${error?.message ?? "Unknown"}`);
  }
}

export async function cancelPortonePayment(
  paymentId: string,
  reason: string,
): Promise<void> {
  const cleanPaymentId = String(paymentId ?? "").trim();
  if (!cleanPaymentId) {
    throw new Error("PortOne cancel failed: paymentId is empty or invalid.");
  }

  const res = await fetch(
    `${PORTONE_API_BASE}/payments/${encodeURIComponent(cleanPaymentId)}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `PortOne ${getApiSecret()}`,
      },
      body: JSON.stringify({ reason: reason || "관리자 취소 요청" }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PortOne cancel failed [${res.status}]: ${body}`);
  }
}

// Simple SHA-256 password hash. Adequate for a public inquiry-only form
// (no account takeover surface — the "password" only unlocks the caller's own
// application record). Not suitable for real user auth.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}