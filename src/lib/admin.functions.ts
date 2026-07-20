import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdmin(context: { supabase: any; userId: string; user?: any }): Promise<boolean> {
  try {
    // 💡 [최종 치트키] 미들웨어(requireSupabaseAuth) 단계에서 토큰을 깨서 넣어준 user 객체가 있다면
    // 수파베이스 서버를 한 번 더 거치지 않고 이메일 텍스트를 즉시 검증합니다.
    if (context.user?.email?.toLowerCase().trim() === "f862@film862.com") {
      return true;
    }

    // 만약 미들웨어 구조에 따라 user가 안전하게 안 넘어왔을 경우를 대비해 세션 데이터를 직접 파싱합니다.
    const { data: { user }, error } = await context.supabase.auth.getUser();
    if (!error && user?.email?.toLowerCase().trim() === "f862@film862.com") {
      return true;
    }

    return false;
  } catch (e) {
    console.error("어드민 권한 검증 중 오류 발생:", e);
    return false;
  }
}

async function assertAdmin(context: { supabase: any; userId: string; user?: any }) {
  const isOk = await isAdmin(context);
  if (!isOk) {
    throw new Error("Forbidden: 관리자 권한이 필요합니다");
  }
}

// 1. 관리자 여부 판별 API
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ok = await isAdmin(context);
    return { isAdmin: ok, userId: context.userId };
  });

// 2. 전체 신청서 목록 가져오기 API
export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    
    const { data, error } = await context.supabase
      .from("applications")
      .select(
        "id, name, phone, email, class_key, schedule, payment_method, amount, status, payment_ref, portone_payment_id, note, refund_requested_at, refunded_at, created_at, updated_at",
      )
      .order("created_at", { ascending: false });
      
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// 3. 신청서 상태 업데이트 API
export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; status: string; refunded?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const patch: { status: string; refunded_at?: string } = { status: data.status };
    if (data.refunded) patch.refunded_at = new Date().toISOString();
    
    const { error } = await context.supabase
      .from("applications")
      .update(patch)
      .eq("id", data.id);
      
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// 4. 신청서 삭제 API
export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const { error } = await context.supabase
      .from("applications")
      .delete()
      .eq("id", data.id);
      
    if (error) throw new Error(error.message);
    return { ok: true };
  });