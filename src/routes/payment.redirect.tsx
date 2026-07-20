import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// 💡 타입 단언(as any)을 완전히 제거하고 컴파일러가 인식할 수 있는 순수 문자열로 수정했습니다.
export const Route = createFileRoute("/payment/redirect")({
  component: PaymentRedirectPage,
});

function PaymentRedirectPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentId = searchParams.get("payment_id");
      const transactionId = searchParams.get("transaction_id");
      const code = searchParams.get("code");
      const message = searchParams.get("message");

      if (code && code !== "SUCCESS") {
        alert(`결제 실패: ${message ?? "결제가 취소되었습니다."}`);
        window.location.href = "/";
        return;
      }

      if (paymentId) {
        localStorage.setItem("mobile_payment_success_id", paymentId);
        if (transactionId) {
          localStorage.setItem("mobile_payment_success_ref", transactionId);
        }
        window.location.href = "/applications/lookup"; 
      } else {
        window.location.href = "/";
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">결제 결과를 처리하고 있습니다</h2>
        <p className="mt-1 text-sm text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </div>
  );