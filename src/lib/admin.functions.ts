import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdmin(context: { supabase: any; userId: string }): Promise<boolean> {
  try {
    // 수파베이스 서비스 롤 권한으로 현재 토큰을 가진 유저의 상세 정보(이메일 포함)를 가져옵니다.
    const { data: { user }, error } = await context.supabase.auth.admin.getUserById(context.userId);
    
    if (error || !user) return false;
    
    // 이메일이 지정한 마스터 어드민 주소와 일치할 때만 true 반환
    return user.email?.toLowerCase().trim() === "f862@film862.com";
  } catch (e) {
    console.error("어드민 권한 검증 중 오류 발생:", e);
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