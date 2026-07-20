import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdmin(context: { supabase: any; userId: string }): Promise<boolean> {
  try {
    // 💡 토큰을 파싱하여 로그인한 유저의 진짜 세션 정보를 가져옵니다.
    const { data: { user }, error } = await context.supabase.auth.getUser();
    if (error || !user) return false;
    
    // 이메일 주소가 마스터 계정과 정확히 일치하는지 확인합니다.
    return user.email?.toLowerCase().trim() === "f862@film862.com";
  } catch (e) {
    console.error("서버단 권한 검증 에러:", e);
    return false;
  }
}

async function assertAdmin(context: { supabase: any; userId: string }) {
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
    
    // 💡 서비스 롤 권한을 가진 어드민 클라이언트를 가져와 RLS 보안 정책을 우회하고 데이터를 확실하게 긁어옵니다.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data, error } = await supabaseAdmin
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const patch: { status: string; refunded_at?: string } = { status: data.status };
    if (data.refunded) patch.refunded_at = new Date().toISOString();
    
    const { error } = await supabaseAdmin
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from("applications")
      .delete()
      .eq("id", data.id);
      
    if (error) throw new Error(error.message);
    return { ok: true };
  });