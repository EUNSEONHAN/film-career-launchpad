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

export async function getPortonePayment(
  paymentId: string,
): Promise<PortonePayment> {
  const storeId = process.env.PORTONE_STORE_ID;
  const url = new URL(
    `${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`,
  );
  if (storeId) url.searchParams.set("storeId", storeId);
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `PortOne ${getApiSecret()}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PortOne getPayment failed [${res.status}]: ${body}`);
  }
  return (await res.json()) as PortonePayment;
}

export async function cancelPortonePayment(
  paymentId: string,
  reason: string,
): Promise<void> {
  const res = await fetch(
    `${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `PortOne ${getApiSecret()}`,
      },
      body: JSON.stringify({ reason }),
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
