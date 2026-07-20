import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/payment/redirect" as any)({
  component: PaymentRedirectPage,
});

function PaymentRedirectPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 💡 포트원 V2 모바일 리다이렉트 시 URL 뒤에 붙어오는 파라미터 추출
      const searchParams = new URLSearchParams(window.location.search);
      const paymentId = searchParams.get("payment_id");
      const transactionId = searchParams.get("transaction_id");
      const code = searchParams.get("code");
      const message = searchParams.get("message");

      // 오류 코드가 와서 결제 실패한 경우
      if (code && code !== "SUCCESS") {
        alert(`결제 실패: ${message ?? "결제가 취소되었습니다."}`);
        window.location.href = "/"; // 홈 또는 신청 폼 페이지로 튕김
        return;
      }

      if (paymentId) {
        // 💡 성공 정보를 localStorage에 안전하게 보관하여 부모 창(또는 원래 라우트)이 감지하게 함
        localStorage.setItem("mobile_payment_success_id", paymentId);
        if (transactionId) {
          localStorage.setItem("mobile_payment_success_ref", transactionId);
        }

        // 💡 중요: 복잡한 모듈 유실을 방지하기 위해 window 단에서 클린하게 원래 완료 페이지로 점프
        // (예시: 신청 결과 확인 페이지나 메인화면 등 원하시는 원래의 완료 주소를 적어주세요)
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
}