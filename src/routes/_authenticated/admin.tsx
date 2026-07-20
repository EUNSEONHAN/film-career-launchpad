import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  checkIsAdmin,
  listApplications,
  updateApplicationStatus,
  deleteApplication,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "관리자 | 862 아카데미" }] }),
});

const CLASS_LABELS: Record<string, string> = {
  class1: "1강 · 진로 탐색",
  class2: "2강 · 취업 서류",
  class3: "3강 · 1:1 컨설팅",
  package: "스타터 PKG",
};

const PAYMENT_LABELS: Record<string, string> = {
  card: "카드",
  kakaopay: "카카오페이",
  bank: "무통장입금",
};

function splitPackageSchedule(schedule: string): { class1: string; class2: string } {
  const s = schedule ?? "";
  const m = s.match(/1강:\s*(.*?)\s*(?:\+\s*2강:\s*(.*))?$/);
  return { class1: m?.[1]?.trim() ?? "", class2: m?.[2]?.trim() ?? "" };
}


function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const checkFn = useServerFn(checkIsAdmin);
  const listFn = useServerFn(listApplications);
  const updateFn = useServerFn(updateApplicationStatus);
  const deleteFn = useServerFn(deleteApplication);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const adminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkFn(),
    retry: false,
  });

  const appsQ = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => listFn(),
    enabled: !!adminQ.data?.isAdmin,
    retry: false,
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; status: string; refunded?: boolean }) =>
      updateFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });

  const rows = useMemo(() => {
    const list = (appsQ.data ?? []) as any[];
    const q = query.trim().toLowerCase();

    // Expand: PKG rows appear as two virtual rows (class1, class2) for filtering.
    const expanded: any[] = [];
    for (const r of list) {
      if (r.class_key === "package") {
        const { class1, class2 } = splitPackageSchedule(r.schedule);
        expanded.push({ ...r, _viewClass: "class1", _viewSchedule: class1, _viewLabel: "1강 · 진로 탐색 (PKG)" });
        expanded.push({ ...r, _viewClass: "class2", _viewSchedule: class2, _viewLabel: "2강 · 취업 서류 (PKG)" });
      } else {
        expanded.push({ ...r, _viewClass: r.class_key, _viewSchedule: r.schedule, _viewLabel: CLASS_LABELS[r.class_key] ?? r.class_key });
      }
    }

    // When filter is "all", collapse PKG back to a single row.
    const base = classFilter === "all"
      ? list.map((r) => ({ ...r, _viewClass: r.class_key, _viewSchedule: r.schedule, _viewLabel: CLASS_LABELS[r.class_key] ?? r.class_key }))
      : expanded.filter((r) => r._viewClass === classFilter);

    return base.filter((r) => {
      if (q && !(
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q)
      )) return false;
      if (dateFilter) {
        const d = new Date(r.created_at).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      return true;
    });
  }, [appsQ.data, query, classFilter, dateFilter]);


  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function exportCsv() {
    const list = rows;
    const header = [
      "id","이름","연락처","이메일","클래스","일정","결제수단","금액","상태","결제ID","신청일","환불요청","환불완료",
    ];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      header.join(","),
      ...list.map((r: any) =>
        [
          r.id, r.name, r.phone, r.email,
          r._viewLabel ?? (CLASS_LABELS[r.class_key] ?? r.class_key),
          r._viewSchedule ?? r.schedule,
          PAYMENT_LABELS[r.payment_method] ?? r.payment_method,
          r.amount, r.status,
          r.portone_payment_id ?? r.payment_ref ?? "",
          r.created_at, r.refund_requested_at ?? "", r.refunded_at ?? "",
        ].map(escape).join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  if (adminQ.isLoading) {
    return <div className="p-10 text-center text-muted-foreground">확인 중...</div>;
  }

  if (adminQ.isError || !adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center rounded-2xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold text-foreground">접근 권한이 없습니다</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">862 아카데미 · 관리자</h1>
            <p className="text-xs text-muted-foreground">신청 내역 관리</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              CSV 다운로드
            </button>
            <button
              onClick={handleLogout}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            placeholder="이름·이메일·전화번호 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-72 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">전체 클래스</option>
            <option value="class1">1강 · 진로 탐색 (PKG 포함)</option>
            <option value="class2">2강 · 취업 서류 (PKG 포함)</option>
            <option value="class3">3강 · 1:1 컨설팅</option>
            <option value="package">스타터 PKG만</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {(dateFilter || classFilter !== "all" || query) && (
            <button
              onClick={() => { setDateFilter(""); setClassFilter("all"); setQuery(""); }}
              className="rounded-md border border-border px-3 py-2 text-xs hover:bg-accent"
            >
              필터 초기화
            </button>
          )}
          <div className="text-xs text-muted-foreground">
            {rows.length}건 표시 / 전체 {(appsQ.data ?? []).length}건
          </div>
        </div>


        {appsQ.isLoading && <p className="text-muted-foreground">불러오는 중...</p>}
        {appsQ.isError && (
          <p className="text-red-500">불러오기 실패: {(appsQ.error as Error).message}</p>
        )}

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">신청일</th>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">연락처</th>
                <th className="px-3 py-2">이메일</th>
                <th className="px-3 py-2">클래스 · 일정</th>
                <th className="px-3 py-2">결제</th>
                <th className="px-3 py-2">금액</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.phone}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">
                    <div>{CLASS_LABELS[r.class_key] ?? r.class_key}</div>
                    {r.schedule && (
                      <div className="text-xs text-muted-foreground whitespace-pre-line">
                        {r.schedule}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{r.payment_method === "card" ? "카드/카카오" : "무통장"}</div>
                    {r.portone_payment_id && (
                      <div className="text-muted-foreground break-all">
                        {r.portone_payment_id}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{r.amount?.toLocaleString()}원</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                    {r.refunded_at && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        환불완료 {new Date(r.refunded_at).toLocaleDateString("ko-KR")}
                      </div>
                    )}
                    {r.refund_requested_at && !r.refunded_at && (
                      <div className="mt-1 text-[10px] text-yellow-500">
                        환불요청 {new Date(r.refund_requested_at).toLocaleDateString("ko-KR")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {r.payment_method === "bank" && r.status !== "paid" && r.status !== "refunded" && (
                        <button
                          onClick={() =>
                            updateMut.mutate({ id: r.id, status: "paid" })
                          }
                          className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                        >
                          입금 확인 완료
                        </button>
                      )}
                      {r.payment_method === "bank" && r.status === "paid" && (
                        <button
                          onClick={() =>
                            updateMut.mutate({ id: r.id, status: "deposit_pending" })
                          }
                          className="rounded border border-border px-2 py-1 text-xs hover:bg-accent"
                        >
                          입금 확인 취소
                        </button>
                      )}
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateMut.mutate({ id: r.id, status: e.target.value })
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="deposit_pending">deposit_pending</option>
                        <option value="refund_requested">refund_requested</option>
                        <option value="refunded">refunded</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      {!r.refunded_at && (
                        <button
                          onClick={() =>
                            updateMut.mutate({
                              id: r.id,
                              status: "refunded",
                              refunded: true,
                            })
                          }
                          className="rounded border border-border px-2 py-1 text-xs hover:bg-accent"
                        >
                          환불 완료 처리
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("정말 삭제하시겠습니까?")) deleteMut.mutate(r.id);
                        }}
                        className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                      >
                        삭제
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
              {rows.length === 0 && !appsQ.isLoading && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                    신청 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    deposit_pending: "bg-blue-500/20 text-blue-400",
    refund_requested: "bg-orange-500/20 text-orange-400",
    refunded: "bg-gray-500/20 text-gray-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}
