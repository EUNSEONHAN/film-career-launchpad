import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdmin(context: { supabase: any; userId: string }): Promise<boolean> {
  // 💡 [무적 프리패스 코드 추가] 
  // 수파베이스 Authentication -> Users에서 복사하셨던 본인의 36자리 UUID 주소를 여기에 넣어줍니다.
  if (context.userId === "136fb019-9e4b-40bf-b68b-2ed88211d1dc") {
    return true;
  }

  // 기존 검증 로직 (혹시 모를 다른 관리자를 위해 유지)
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("권한 확인 실패");
  return !!data;
}
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  if (!(await isAdmin(context))) throw new Error("Forbidden: 관리자 권한이 필요합니다");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ok = await isAdmin(context);
    return { isAdmin: ok, userId: context.userId };
  });


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
