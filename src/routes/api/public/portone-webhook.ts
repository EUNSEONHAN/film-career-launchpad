import { createFileRoute } from "@tanstack/react-router";

// PortOne V2 webhook receiver. External caller = PortOne; this path is
// exempt from Lovable published-site auth, so we verify + fetch inside.
// Body shape (V2): { type: "Transaction.Paid" | "Transaction.Cancelled" | ...,
//                    data: { paymentId, transactionId, storeId, ... } }
export const Route = createFileRoute("/api/public/portone-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: {
          type?: string;
          data?: { paymentId?: string; transactionId?: string };
        };
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const paymentId = payload.data?.paymentId;
        if (!paymentId) {
          return new Response("Missing paymentId", { status: 400 });
        }

        try {
          const { getPortonePayment } = await import("@/lib/portone.server");
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const payment = await getPortonePayment(paymentId);

          const { data: app } = await supabaseAdmin
            .from("applications")
            .select("id, amount")
            .eq("portone_payment_id", paymentId)
            .single();

          if (!app) return new Response("ok"); // unknown paymentId, ack anyway

          const paid = payment.amount?.total ?? 0;
          let nextStatus: string | null = null;
          const patch: Record<string, unknown> = {};

          if (payment.status === "PAID" && paid === app.amount) {
            nextStatus = "paid";
            patch.payment_ref = payment.transactionId ?? payment.id;
          } else if (payment.status === "FAILED") {
            nextStatus = "failed";
          } else if (
            payment.status === "CANCELLED" ||
            payment.status === "PARTIAL_CANCELLED"
          ) {
            nextStatus = "refunded";
            patch.refunded_at = new Date().toISOString();
          }

          if (nextStatus) {
            await supabaseAdmin
              .from("applications")
              .update({ status: nextStatus, ...patch })
              .eq("id", app.id);
          }

          return new Response("ok");
        } catch (err) {
          console.error("portone-webhook error", err);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
