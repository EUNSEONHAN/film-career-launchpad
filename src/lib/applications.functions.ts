import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CLASS_PRICES: Record<string, number> = {
  class1: 100_000,
  class2: 100_000,
  class3: 150_000,
  package: 180_000,
};

const CLASS_NAMES: Record<string, string> = {
  class1: "영화 영상 진로탐색",
  class2: "취업 서류 3종 완성",
  class3: "1:1 커리어 컨설팅",
  package: "스타터 PKG (1+2)",
};

// ---------- PortOne public client config (read at runtime) ----------

export const getPortoneClientConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      storeId: process.env.PORTONE_STORE_ID ?? "",
      channelKeys: {
        card: process.env.PORTONE_CHANNEL_KEY_CARD ?? "",
        kakaopay: process.env.PORTONE_CHANNEL_KEY_KAKAOPAY ?? "",
      },
    };
  },
);


// ---------- Create application (before payment window opens) ----------

const createSchema = z.object({
  name: z.string().min(1).max(40),
  phone: z.string().min(1).max(20),
  email: z.string().email().max(120),
  password: z.string().min(4).max(60),
  note: z.string().max(500).default(""),
  classKey: z.enum(["class1", "class2", "class3", "package"]),
  schedule: z.string().max(200).default(""),
  paymentMethod: z.enum(["card", "kakaopay", "bank"]),
});

export const createApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { hashPassword } = await import("@/lib/portone.server");

    const amount = CLASS_PRICES[data.classKey];
    const paymentId = `862-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email.toLowerCase().trim(),
        password_hash: await hashPassword(data.password),
        note: data.note,
        class_key: data.classKey,
        schedule: data.schedule,
        payment_method: data.paymentMethod,
        amount,
        status: data.paymentMethod === "bank" ? "bank_pending" : "pending",
        portone_payment_id: data.paymentMethod === "bank" ? null : paymentId,
      })
      .select("id, portone_payment_id, amount")
      .single();

    if (error) throw new Error(`Failed to create application: ${error.message}`);

    return {
      applicationId: row.id,
      paymentId: row.portone_payment_id,
      amount: row.amount,
      orderName: `862 Academy · ${CLASS_NAMES[data.classKey]}`,
    };
  });

// ---------- Verify PortOne payment after browser SDK returns ----------

const verifySchema = z.object({
  applicationId: z.string().uuid(),
  paymentId: z.string().min(1).max(200),
});

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { getPortonePayment } = await import("@/lib/portone.server");

    const { data: app, error: fetchError } = await supabaseAdmin
      .from("applications")
      .select("id, amount, portone_payment_id, status")
      .eq("id", data.applicationId)
      .single();
    if (fetchError || !app) throw new Error("Application not found");
    if (app.portone_payment_id !== data.paymentId) {
      throw new Error("Payment ID mismatch");
    }

    let payment;
    try {
      payment = await getPortonePayment(data.paymentId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "PortonePaymentPendingError"
      ) {
        return {
          ok: false as const,
          status: "PENDING" as const,
          retryable: true as const,
          message: "결제 승인 결과를 확인하고 있습니다.",
        };
      }
      throw error;
    }
    const paidAmount = payment.amount?.total ?? 0;

    if (
      payment.status === "READY" ||
      payment.status === "PENDING" ||
      payment.status === "VIRTUAL_ACCOUNT_ISSUED"
    ) {
      return {
        ok: false as const,
        status: payment.status,
        retryable: true as const,
        message: "결제 승인 결과를 확인하고 있습니다.",
      };
    }

    if (payment.status !== "PAID" || paidAmount !== app.amount) {
      await supabaseAdmin
        .from("applications")
        .update({ status: "failed" })
        .eq("id", app.id);
      return {
        ok: false as const,
        status: payment.status,
        message: payment.failure?.message ?? "결제가 완료되지 않았습니다.",
      };
    }

    await supabaseAdmin
      .from("applications")
      .update({
        status: "paid",
        payment_ref: payment.transactionId ?? payment.id,
      })
      .eq("id", app.id);

    return { ok: true as const, status: "PAID" as const };
  });

// ---------- Verify by paymentId only (redirect return flow) ----------

export const verifyPaymentByPaymentId = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ paymentId: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { getPortonePayment } = await import("@/lib/portone.server");

    const { data: app, error: fetchError } = await supabaseAdmin
      .from("applications")
      .select("id, amount, portone_payment_id, status")
      .eq("portone_payment_id", data.paymentId)
      .single();
    if (fetchError || !app) throw new Error("Application not found");

    let payment;
    try {
      payment = await getPortonePayment(data.paymentId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "PortonePaymentPendingError"
      ) {
        return {
          ok: false as const,
          status: "PENDING" as const,
          retryable: true as const,
          message: "결제 승인 결과를 확인하고 있습니다.",
        };
      }
      throw error;
    }
    const paidAmount = payment.amount?.total ?? 0;

    if (
      payment.status === "READY" ||
      payment.status === "PENDING" ||
      payment.status === "VIRTUAL_ACCOUNT_ISSUED"
    ) {
      return {
        ok: false as const,
        status: payment.status,
        retryable: true as const,
        message: "결제 승인 결과를 확인하고 있습니다.",
      };
    }

    if (payment.status !== "PAID" || paidAmount !== app.amount) {
      await supabaseAdmin
        .from("applications")
        .update({ status: "failed" })
        .eq("id", app.id);
      return {
        ok: false as const,
        status: payment.status,
        message: payment.failure?.message ?? "결제가 완료되지 않았습니다.",
      };
    }

    await supabaseAdmin
      .from("applications")
      .update({
        status: "paid",
        payment_ref: payment.transactionId ?? payment.id,
      })
      .eq("id", app.id);

    return { ok: true as const, status: "PAID" as const };
  });

// ---------- Lookup applications by email + password ----------

const lookupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const lookupApplications = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => lookupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { hashPassword } = await import("@/lib/portone.server");

    const passwordHash = await hashPassword(data.password);
    const { data: rows, error } = await supabaseAdmin
      .from("applications")
      .select(
        "id, name, phone, email, class_key, schedule, payment_method, amount, status, created_at, refund_requested_at, refunded_at",
      )
      .eq("email", data.email.toLowerCase().trim())
      .eq("password_hash", passwordHash)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Refund request ----------

const refundSchema = z.object({
  applicationId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestRefund = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => refundSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { hashPassword, cancelPortonePayment } = await import(
      "@/lib/portone.server"
    );

    const passwordHash = await hashPassword(data.password);
    const { data: app, error } = await supabaseAdmin
      .from("applications")
      .select(
        "id, email, password_hash, status, payment_method, portone_payment_id",
      )
      .eq("id", data.applicationId)
      .single();

    if (
      error ||
      !app ||
      app.email !== data.email.toLowerCase().trim() ||
      app.password_hash !== passwordHash
    ) {
      throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    if (app.status === "refunded" || app.status === "refund_requested") {
      return { ok: true as const, alreadyRequested: true };
    }

    // Card / kakaopay: try to cancel via PortOne immediately.
    if (
      (app.payment_method === "card" || app.payment_method === "kakaopay") &&
      app.status === "paid" &&
      app.portone_payment_id
    ) {
      try {
        await cancelPortonePayment(app.portone_payment_id, "고객 환불 요청");
        await supabaseAdmin
          .from("applications")
          .update({
            status: "refunded",
            refund_requested_at: new Date().toISOString(),
            refunded_at: new Date().toISOString(),
          })
          .eq("id", app.id);
        return { ok: true as const, refunded: true };
      } catch (err) {
        console.error("PortOne cancel failed", err);
        // fall through to mark as requested for manual handling
      }
    }

    await supabaseAdmin
      .from("applications")
      .update({
        status: "refund_requested",
        refund_requested_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    return { ok: true as const, refunded: false };
  });
