import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  CreditCard,
  Film,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import defaultHeroVideo from "@/assets/cover_1080p.mp4.asset.json";
import instructorImg from "@/assets/최지원.jpeg.asset.json";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

type ClassKey = "class1" | "class2" | "class3" | "package";

const CLASS_OPTIONS: {
  key: ClassKey;
  title: string;
  price: string;
  schedules: string[];
}[] = [
  {
    key: "class1",
    title: "1. 영화 영상 진로탐색",
    price: "100,000원",
    schedules: ["8월 5일(수) 16:00~18:00", "8월 6일(목) 19:00~21:00"],
  },
  {
    key: "class2",
    title: "2. 취업 서류 3종 완성",
    price: "100,000원",
    schedules: ["8월 5일(수) 19:00~21:00", "8월 6일(목) 16:00~18:00"],
  },
  {
    key: "class3",
    title: "3. 1:1 커리어 컨설팅",
    price: "150,000원 / 1시간",
    schedules: ["신청 후 일정 개별 조율"],
  },
  {
    key: "package",
    title: "4. 스타터 PKG (1+2)",
    price: "180,000원",
    schedules: [
      "1강: 8월 5일(수) 16:00~18:00 + 2강: 8월 5일(수) 19:00~21:00",
      "1강: 8월 6일(목) 19:00~21:00 + 2강: 8월 6일(목) 16:00~18:00",
    ],
  },
];

const NAV = [
  { id: "home", label: "홈" },
  { id: "story", label: "클래스 소개" },
  { id: "classes", label: "가격안내" },
  { id: "check", label: "신청 조회" },
];

type PaymentMethod = "card" | "kakaopay" | "bank";
type ApplicationStatus =
  | "pending"
  | "bank_pending"
  | "paid"
  | "failed"
  | "refund_requested"
  | "refunded";

// Server-shaped record returned from lookupApplications.
type AppRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  class_key: ClassKey;
  schedule: string;
  payment_method: PaymentMethod;
  amount: number;
  status: ApplicationStatus;
  created_at: string;
  refund_requested_at: string | null;
  refunded_at: string | null;
};

// Client-shaped copy used only for the payment-confirmation dialogs after submit.
type Application = {
  id: string;
  name: string;
  email: string;
  classKey: ClassKey;
  schedule: string;
  payment: PaymentMethod;
  paymentRef?: string;
  amount: number;
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);

  // Handle PortOne redirect return (mobile flow)
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentId = url.searchParams.get("portone");
    if (!paymentId) return;
    url.searchParams.delete("portone");
    window.history.replaceState({}, "", url.toString());
    (async () => {
      try {
        const { verifyPaymentByPaymentId } = await import(
          "@/lib/applications.functions"
        );
        const res = await verifyPaymentByPaymentId({ data: { paymentId } });
        if (res.ok) {
          toast.success("결제가 완료되었습니다.");
        } else {
          toast.error(res.message ?? "결제 검증에 실패했습니다.");
        }
      } catch (e) {
        console.error(e);
        toast.error("결제 확인 중 오류가 발생했습니다.");
      }
    })();
  }, []);





  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-center" />
      <Nav
        onMobileToggle={() => setMobileOpen((v) => !v)}
        mobileOpen={mobileOpen}
        onOpenCheck={() => setCheckOpen(true)}
        closeMobile={() => setMobileOpen(false)}
      />
      <Hero />
      <Story />
      <Classes />
      <Instructor />
      <ApplyForm />
      <Footer />
      <CheckDialog open={checkOpen} onOpenChange={setCheckOpen} />
    </div>
  );
}

/* -------------------- NAV -------------------- */
function Nav({
  onMobileToggle,
  mobileOpen,
  onOpenCheck,
  closeMobile,
}: {
  onMobileToggle: () => void;
  mobileOpen: boolean;
  onOpenCheck: () => void;
  closeMobile: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled
          ? "border-b border-border/50 bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => scrollTo("home")}
          className="flex items-center gap-2 tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-neon text-neon-foreground">
            <Film className="h-4 w-4" />
          </span>
          <span className="font-script text-2xl leading-none text-neon">862 Academy</span>
        </button>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() =>
                n.id === "check" ? onOpenCheck() : scrollTo(n.id)
              }
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {n.label}
            </button>
          ))}
          <Button
            onClick={() => scrollTo("apply")}
            variant="outline"
            size="sm"
            className="border-neon/40 text-neon hover:bg-neon hover:text-neon-foreground"
          >
            신청하기
          </Button>
        </nav>
        <button
          onClick={onMobileToggle}
          className="md:hidden"
          aria-label="menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col p-4">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  closeMobile();
                  if (n.id === "check") onOpenCheck();
                  else scrollTo(n.id);
                }}
                className="py-3 text-left text-sm text-foreground"
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/* -------------------- HERO -------------------- */
function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      <div className="absolute inset-0">
        <video
          src={defaultHeroVideo.url}
          className="h-full w-full object-cover opacity-70"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <Badge
          variant="outline"
          className="mb-6 border-neon/40 bg-neon/10 text-neon"
        >
          <Sparkles className="mr-1 h-3 w-3" /> 영화·영상 전공자를 위한 첫번째 클래스
        </Badge>
        <h1 className="font-display font-bold text-balance">
          <span className="block text-2xl leading-tight text-muted-foreground sm:text-3xl md:text-4xl">
            영화과 다니다가
          </span>
          <span className="mt-3 block text-6xl leading-[1.05] text-neon text-glow sm:text-7xl md:text-8xl lg:text-9xl">
            '졸업하고 뭐하지'
          </span>
          <span className="mt-3 block text-2xl leading-tight text-muted-foreground sm:text-3xl md:text-4xl">
            한 번이라도 고민한 적 있으신가요?
          </span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          영화, 영상 전공자를 위한 첫번째 클래스. 졸업 후 진로부터 취업서류, 1:1
          커리어 컨설팅. 영화를 배운 다음의 이야기를 함께 나눠보려 합니다.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={() => scrollTo("apply")}
            className="group h-14 bg-neon px-8 text-base font-semibold text-neon-foreground hover:bg-neon/90"
          >
            클래스 신청하러 가기
            <ArrowRight className="ml-2 h-5 w-5 transition group-hover:translate-x-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollTo("classes")}
            className="h-14 border-border bg-background/40 px-8 text-base backdrop-blur"
          >
            <Play className="mr-2 h-4 w-4" /> 클래스 살펴보기
          </Button>
        </div>
      </div>
    </section>
  );
}

/* -------------------- STORY -------------------- */
function Story() {
  return (
    <section id="story" className="relative py-24 sm:py-32">

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-sm tracking-widest text-neon uppercase">
          From the founder
        </div>
        <h2 className="font-display text-3xl leading-tight font-bold text-balance sm:text-4xl md:text-5xl">
          "영화를 배웠지만,
          <br />
          <span className="text-muted-foreground">
            졸업 후 어떤 길을 선택할 수 있는지는
          </span>
          <br />
          배운 적이 없으니까요."
        </h2>
        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            저 역시 영화과를 졸업할 때 가장 막막했던 건{" "}
            <span className="text-foreground">"그래서 이제 뭘 하지?"</span>{" "}
            였습니다. 주변 사람들의 진로를 따라가는 것 말고는, 내가 선택할 수
            있는 다양한 길을 알 기회조차 없었습니다.
          </p>
          <p>
            지금은 회사 대표이자 영화산업 면접관으로 수많은 지원자를 만나고,
            강의를 통해 학생들을 만나며 한가지를 깨달았습니다.{" "}
            <span className="text-foreground">
              좋은 경험이 있어도, 자신의 강점과 가능성을 제대로 보여주지 못한다는 것.
            </span>{" "}
            그래서 이 강의를 만들었습니다.
          </p>
        </div>
        <div className="mt-10 border-l-2 border-neon/60 pl-4">
          <div className="text-sm text-muted-foreground">최지원</div>
          <div className="text-xs text-muted-foreground/70">
            (주)에프팔육이 대표이사 · 영화산업 면접관
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- CLASSES -------------------- */
function Classes() {
  const classes = [
    {
      num: "01",
      title: "영화 영상 진로탐색",
      price: "100,000원",
      desc: "다양한 사업과 직무를 이해하고, 나에게 맞는 진로를 찾아봅니다.",
      bullets: ["영화 영상 산업 구조 이해", "나에게 맞는건? 현장직 vs 사무직"],
      schedules: ["8월 5일(수) 16:00~18:00", "8월 6일(목) 19:00~21:00"],
    },
    {
      num: "02",
      title: "취업 서류 3종 완성",
      price: "100,000원",
      desc: "채용 담당자의 시선으로, 기업과 직무에 맞는 취업 서류를 완성합니다.",
      bullets: [
        "이력서, 포트폴리오, 자기소개서",
        "기업과 직무에 맞게 나를 보여주는 방법",
      ],
      schedules: ["8월 5일(수) 19:00~21:00", "8월 6일(목) 16:00~18:00"],
    },
    {
      num: "03",
      title: "1:1 커리어 컨설팅",
      price: "150,000원 / 1시간",
      desc: "나의 강점과 경험을 분석하고, 진로 설계부터 취업 서류 컨설팅까지 함께합니다.",
      bullets: ["신청 후 일정 개별 조율", "상시 신청 가능"],
      schedules: [],
    },
  ];

  return (
    <section id="classes" className="relative border-t border-border/50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 text-sm tracking-widest text-neon uppercase">
              Classes
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
              세 가지 클래스
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              진로 탐색부터 실전 취업 서류, 1:1 커리어 컨설팅까지.
            </p>
          </div>
          <Badge className="bg-neon/15 text-neon hover:bg-neon/20">
            <Sparkles className="mr-1 h-3 w-3" /> 각종 기업 취업 연계는 덤!
          </Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {classes.map((c) => (
            <article
              key={c.num}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition hover:border-neon/40 hover:bg-surface-elevated"
            >
              <div className="mb-6 flex items-start justify-between">
                <span className="font-display text-4xl font-bold text-neon/30 transition group-hover:text-neon">
                  {c.num}
                </span>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">수강료</div>
                  <div className="font-semibold">{c.price}</div>
                </div>
              </div>
              <h3 className="text-xl font-bold">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {c.desc}
              </p>
              <ul className="mt-5 space-y-2">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {c.schedules.length > 0 && (
                <div className="mt-6 border-t border-border/60 pt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> 일정 선택
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {c.schedules.map((s) => (
                      <li key={s} className="text-foreground/90">
                        · {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Package deal */}
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-neon/40 bg-gradient-to-br from-neon/15 via-neon/5 to-transparent p-6 sm:p-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 sm:flex sm:justify-between">
            <div className="min-w-0">
              <Badge className="mb-3 bg-neon text-neon-foreground hover:bg-neon">
                10% OFF
              </Badge>
              <h3 className="text-xl font-bold sm:text-2xl">
                4. 스타터 PKG (1+2 함께 신청 시)
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                진로탐색 + 취업서류. 두 클래스를 함께 시작하세요.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm text-muted-foreground line-through">
                200,000원
              </div>
              <div className="font-display text-2xl font-bold text-neon sm:text-3xl">
                180,000원
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-4 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
          <div>
            <span className="font-medium text-foreground">장소</span>{" "}
            <span className="text-muted-foreground">
              경기도 성남시 분당구 판교로 289번길 20 판교스타트업캠퍼스 (주차가능)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- INSTRUCTOR -------------------- */
function Instructor() {
  return (
    <section className="relative border-t border-border/50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-3 text-sm tracking-widest text-neon uppercase">
          Instructor
        </div>
        <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          강사 소개
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,1fr)_1.4fr] md:items-start">
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <img
              src={instructorImg.url}
              alt="최지원 대표"
              width={1024}
              height={1280}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-5">
              <div className="text-xs text-neon">Founder & CEO</div>
              <div className="font-display text-2xl font-bold">최지원</div>
            </div>
          </div>

          <div>
            <p className="text-lg text-muted-foreground">
              대표이사 · 영화산업 면접관
            </p>
            <ul className="mt-6 space-y-2 text-sm sm:text-base">
              <li>· (주)에프팔육이 대표이사</li>
              <li>· 경기필름스쿨페스티벌 사무국장</li>
              <li>· 부산국제영화제 디지털 아카이빙 프로젝트 총괄디렉터</li>
            </ul>

            <Tabs defaultValue="teach" className="mt-8">
              <TabsList className="bg-surface">
                <TabsTrigger value="teach">강의 이력</TabsTrigger>
                <TabsTrigger value="judge">심사</TabsTrigger>
              </TabsList>
              <TabsContent
                value="teach"
                className="mt-4 rounded-xl border border-border bg-surface/40 p-5 text-sm leading-relaxed"
              >
                <ul className="grid gap-2 sm:grid-cols-2">
                  <li>· 2026 아트코리아랩 멘토</li>
                  <li>· 2026 연세대학교 기술대학원</li>
                  <li>· 2025 성결대학교</li>
                  <li>· 2025 계원예술대학교</li>
                  <li>· 2025 세그루패션디자인고등학교</li>
                </ul>
              </TabsContent>
              <TabsContent
                value="judge"
                className="mt-4 rounded-xl border border-border bg-surface/40 p-5 text-sm leading-relaxed"
              >
                <ul className="grid gap-2 sm:grid-cols-2">
                  <li>· 동국대학교 영화제 (2026)</li>
                  <li>· 용인대학교 영화제 (2024, 2025)</li>
                  <li>· 대한민국대학영화제 (2024)</li>
                  <li>· 성결대학교 영화제 (2023–2025)</li>
                  <li>· 고양청소년영상공모전 (2020)</li>
                  <li>· EBS국제 다큐멘터리 영화제 (2020–2022)</li>
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- APPLY FORM -------------------- */
type PayStage =
  | { kind: "idle" }
  | { kind: "processing"; method: PaymentMethod }
  | { kind: "card-success"; app: Application }
  | { kind: "bank-pending"; app: Application };

const BANK_INFO = {
  bank: "신한은행",
  account: "123-456-7890",
  holder: "주식회사 에프팔육이",
};

function priceOf(key: ClassKey): number {
  switch (key) {
    case "class1":
    case "class2":
      return 100000;
    case "class3":
      return 150000;
    case "package":
      return 180000;
  }
}

// PortOne V2 browser SDK — loaded dynamically on demand (browser only).
async function openPortonePayment(args: {
  method: "card" | "kakaopay";
  paymentId: string;
  orderName: string;
  totalAmount: number;
  customer: { fullName: string; email: string; phoneNumber: string };
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { getPortoneClientConfig } = await import(
    "@/lib/applications.functions"
  );
  const cfg = await getPortoneClientConfig();
  const channelKey = cfg.channelKeys[args.method];
  if (!cfg.storeId || !channelKey) {
    return {
      ok: false,
      message:
        "결제 설정이 완료되지 않았습니다. 관리자에게 문의해주세요. (PortOne 키 미설정)",
    };
  }
  const PortOne = (await import("@portone/browser-sdk/v2")).default;
  const req =
    args.method === "kakaopay"
      ? {
          payMethod: "EASY_PAY" as const,
          easyPay: { easyPayProvider: "EASY_PAY_PROVIDER_KAKAOPAY" as const },
        }
      : { payMethod: "CARD" as const };
  const safeOrderName = args.orderName.replace(/[·]/g, "-").slice(0, 40);
  const redirectUrl = `${window.location.origin}/?portone=${encodeURIComponent(args.paymentId)}`;
  const payload: Record<string, unknown> = {
    storeId: cfg.storeId,
    channelKey,
    paymentId: args.paymentId,
    orderName: safeOrderName,
    totalAmount: args.totalAmount,
    currency: "CURRENCY_KRW",
    customer: args.customer,
    ...req,
    // KG Inicis uses a popup on desktop and a redirect on mobile. Declaring
    // both modes prevents the SDK from sending a redirect request to the PC
    // HTML5_INICIS module, which it rejects as an unsupported feature.
    windowType: {
      pc: "POPUP",
      mobile: "REDIRECTION",
    },
    redirectUrl,
  };
  const res = await PortOne.requestPayment(
    payload as Parameters<typeof PortOne.requestPayment>[0],
  );
  if (res?.code) {
    return { ok: false, message: res.message ?? "결제가 취소되었습니다." };
  }
  return { ok: true };
}

function ApplyForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    note: "",
    classKey: "" as ClassKey | "",
    schedule: "",
    schedule1: "",
    schedule2: "",
    payment: "card" as PaymentMethod,
  });
  const [stage, setStage] = useState<PayStage>({ kind: "idle" });

  const isPackage = form.classKey === "package";
  const pkgSchedules1 = CLASS_OPTIONS.find((x) => x.key === "class1")?.schedules ?? [];
  const pkgSchedules2 = CLASS_OPTIONS.find((x) => x.key === "class2")?.schedules ?? [];
  const schedules = useMemo(() => {
    if (isPackage) return [];
    const c = CLASS_OPTIONS.find((x) => x.key === form.classKey);
    return c?.schedules ?? [];
  }, [form.classKey, isPackage]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function resetForm() {
    setForm({
      name: "",
      phone: "",
      email: "",
      password: "",
      note: "",
      classKey: "",
      schedule: "",
      schedule1: "",
      schedule2: "",
      payment: "card",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.password || !form.classKey) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (isPackage) {
      if (!form.schedule1 || !form.schedule2) {
        toast.error("1강과 2강 일정을 모두 선택해주세요.");
        return;
      }
    } else if (schedules.length > 0 && !form.schedule) {
      toast.error("일정을 선택해주세요.");
      return;
    }

    const combinedSchedule = isPackage
      ? `1강: ${form.schedule1} + 2강: ${form.schedule2}`
      : form.schedule || "일정 개별 조율";

    const classKey = form.classKey as ClassKey;
    const paymentMethod = form.payment;

    setStage({ kind: "processing", method: paymentMethod });

    try {
      const { createApplication, verifyPayment } = await import(
        "@/lib/applications.functions"
      );

      const created = await createApplication({
        data: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          password: form.password,
          note: form.note,
          classKey,
          schedule: combinedSchedule,
          paymentMethod,
        },
      });

      const appPreview: Application = {
        id: created.applicationId,
        name: form.name,
        email: form.email.toLowerCase().trim(),
        classKey,
        schedule: combinedSchedule,
        payment: paymentMethod,
        amount: created.amount,
      };

      if (paymentMethod === "bank") {
        setStage({ kind: "bank-pending", app: appPreview });
        resetForm();
        return;
      }

      // Card / KakaoPay via PortOne
      if (!created.paymentId) {
        throw new Error("결제 ID 발급에 실패했습니다.");
      }
      const payRes = await openPortonePayment({
        method: paymentMethod,
        paymentId: created.paymentId,
        orderName: created.orderName,
        totalAmount: created.amount,
        customer: {
          fullName: form.name,
          email: form.email.trim(),
          phoneNumber: form.phone,
        },
      });
      if (!payRes.ok) {
        toast.error(payRes.message);
        setStage({ kind: "idle" });
        return;
      }
      const verifyRes = await verifyPayment({
        data: {
          applicationId: created.applicationId,
          paymentId: created.paymentId,
        },
      });
      if (!verifyRes.ok) {
        toast.error(verifyRes.message ?? "결제 검증에 실패했습니다.");
        setStage({ kind: "idle" });
        return;
      }
      setStage({
        kind: "card-success",
        app: { ...appPreview, paymentRef: created.paymentId },
      });
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "신청 처리 중 오류가 발생했습니다.",
      );
      setStage({ kind: "idle" });
    }
  }



  return (
    <section id="apply" className="relative border-t border-border/50 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-3 text-sm tracking-widest text-neon uppercase">
          Application
        </div>
        <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
          클래스 신청하기
        </h2>
        <p className="mt-3 text-muted-foreground">
          비회원도 신청 가능합니다. 조회용 비밀번호를 꼭 기억해주세요.
        </p>

        <form
          onSubmit={submit}
          className="mt-10 space-y-5 rounded-2xl border border-border bg-surface/60 p-6 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="이름 *">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="홍길동"
                maxLength={40}
              />
            </Field>
            <Field label="전화번호 *">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="010-0000-0000"
                maxLength={20}
              />
            </Field>
            <Field label="이메일 *">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
              />
            </Field>
            <Field label="비밀번호 * (신청 조회용)">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="4자 이상"
                minLength={4}
                maxLength={60}
              />
            </Field>
          </div>

          <Field label="클래스 선택 *">
            <Select
              value={form.classKey}
              onValueChange={(v) => {
                set("classKey", v as ClassKey);
                set("schedule", "");
                set("schedule1", "");
                set("schedule2", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="신청할 클래스를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.title} — {c.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {isPackage && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="1강 일정 *">
                <Select
                  value={form.schedule1}
                  onValueChange={(v) => set("schedule1", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="1강 일정을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {pkgSchedules1.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="2강 일정 *">
                <Select
                  value={form.schedule2}
                  onValueChange={(v) => set("schedule2", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="2강 일정을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {pkgSchedules2.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {!isPackage && schedules.length > 0 && (
            <Field label="일정 *">
              <Select
                value={form.schedule}
                onValueChange={(v) => set("schedule", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="일정을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}


          <Field label="결제 방법 *">
            <RadioGroup
              value={form.payment}
              onValueChange={(v) => set("payment", v as PaymentMethod)}
              className="grid grid-cols-3 gap-3"
            >
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/40 p-3 text-sm has-[[data-state=checked]]:border-neon has-[[data-state=checked]]:bg-neon/10">
                <RadioGroupItem value="card" />
                카드결제
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/40 p-3 text-sm has-[[data-state=checked]]:border-neon has-[[data-state=checked]]:bg-neon/10">
                <RadioGroupItem value="kakaopay" />
                카카오페이
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/40 p-3 text-sm has-[[data-state=checked]]:border-neon has-[[data-state=checked]]:bg-neon/10">
                <RadioGroupItem value="bank" />
                무통장입금
              </label>
            </RadioGroup>
          </Field>


          <Field label="비고">
            <Textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="추가로 남기실 내용을 적어주세요"
              maxLength={500}
              rows={3}
            />
          </Field>

          <div className="space-y-1 rounded-lg border border-border bg-background/30 p-4 text-xs text-muted-foreground">
            <p>* 선착순 모집 / 정원 마감 시 조기 종료</p>
            <p>* 취소·환불: 2일 전 100% / 1일 전 50% / 당일 환불 불가</p>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={stage.kind === "processing"}
            className="h-14 w-full bg-neon text-base font-semibold text-neon-foreground hover:bg-neon/90"
          >
            {stage.kind === "processing" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 처리 중...
              </>
            ) : form.payment === "bank" ? (
              "신청하기"
            ) : (
              "결제하기"
            )}

          </Button>
        </form>
      </div>

      <PaymentProcessingDialog
        open={stage.kind === "processing"}
        method={stage.kind === "processing" ? stage.method : "card"}
      />
      <CardSuccessDialog
        open={stage.kind === "card-success"}
        app={stage.kind === "card-success" ? stage.app : null}
        onClose={() => setStage({ kind: "idle" })}
      />
      <BankInfoDialog
        open={stage.kind === "bank-pending"}
        app={stage.kind === "bank-pending" ? stage.app : null}
        onClose={() => setStage({ kind: "idle" })}
      />
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* -------------------- PAYMENT DIALOGS -------------------- */
function PaymentProcessingDialog({
  open,
  method,
}: {
  open: boolean;
  method: PaymentMethod;
}) {

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm bg-surface"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-neon" />
          <div>
            <div className="font-semibold">
              {method === "bank"
                ? "신청을 접수하는 중입니다"
                : "결제창을 여는 중입니다"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {method === "bank"
                ? "잠시만 기다려주세요"
                : "포트원(PortOne) 결제창 · 잠시만 기다려주세요"}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CardSuccessDialog({
  open,
  app,
  onClose,
}: {
  open: boolean;
  app: Application | null;
  onClose: () => void;
}) {
  const c = app ? CLASS_OPTIONS.find((x) => x.key === app.classKey) : null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-surface">
        <DialogHeader>
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-neon/15 text-neon">
            <Check className="h-6 w-6" />
          </div>
          <DialogTitle>결제가 완료되었습니다</DialogTitle>
          <DialogDescription>
            신청이 정상적으로 접수되었습니다. 아래 내역을 확인해주세요.
          </DialogDescription>
        </DialogHeader>
        {app && c && (
          <div className="space-y-2 rounded-lg border border-border bg-background/40 p-4 text-sm">
            <Row label="신청자" value={`${app.name} (${app.email})`} />
            <Row label="클래스" value={c.title} />
            <Row label="일정" value={app.schedule} />
            <Row label="결제 금액" value={`${app.amount.toLocaleString()}원`} />
            <Row
              label="결제 방법"
              value={
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />{" "}
                  {app.payment === "kakaopay" ? "카카오페이" : "카드결제"}
                </span>
              }
            />

            {app.paymentRef && (
              <Row label="거래번호" value={<span className="font-mono text-xs">{app.paymentRef}</span>} />
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-neon text-neon-foreground hover:bg-neon/90"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BankInfoDialog({
  open,
  app,
  onClose,
}: {
  open: boolean;
  app: Application | null;
  onClose: () => void;
}) {
  const c = app ? CLASS_OPTIONS.find((x) => x.key === app.classKey) : null;
  const accountText = `${BANK_INFO.bank} ${BANK_INFO.account} (${BANK_INFO.holder})`;
  function copy() {
    navigator.clipboard.writeText(accountText).then(
      () => toast.success("계좌 정보가 복사되었습니다."),
      () => toast.error("복사에 실패했습니다."),
    );
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-surface">
        <DialogHeader>
          <DialogTitle>무통장입금 안내</DialogTitle>
          <DialogDescription>
            아래 계좌로 입금해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-neon/40 bg-neon/5 p-4">
            <div className="text-xs text-muted-foreground">입금 계좌</div>
            <div className="mt-1 font-display text-lg font-bold text-neon">
              {BANK_INFO.holder}
            </div>
            <div className="mt-0.5 text-sm">
              {BANK_INFO.bank} <span className="font-mono">{BANK_INFO.account}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              className="mt-3 h-8 border-neon/40 text-neon hover:bg-neon hover:text-neon-foreground"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> 계좌 복사
            </Button>
          </div>

          {app && c && (
            <div className="space-y-2 rounded-lg border border-border bg-background/40 p-4 text-sm">
              <Row label="신청자" value={`${app.name}`} />
              <Row label="클래스" value={c.title} />
              <Row label="일정" value={app.schedule} />
              <Row
                label="입금 금액"
                value={
                  <span className="font-semibold text-neon">
                    {app.amount.toLocaleString()}원
                  </span>
                }
              />

            </div>
          )}

          <p className="rounded-lg border border-border bg-background/30 p-3 text-xs leading-relaxed text-muted-foreground">
            계좌번호로 입금 완료 후, 관리자 확인을 거쳐 신청이 최종 확정됩니다.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-neon text-neon-foreground hover:bg-neon/90"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}


/* -------------------- CHECK STATUS -------------------- */
function CheckDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [results, setResults] = useState<AppRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setPassword("");
    setResults(null);
  }
  useEffect(() => {
    if (!open) reset();
  }, [open]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { lookupApplications } = await import(
        "@/lib/applications.functions"
      );
      const list = (await lookupApplications({
        data: { email, password },
      })) as AppRecord[];
      setResults(list);
      if (list.length === 0) toast.error("일치하는 신청 내역이 없습니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function refund(id: string) {
    setRefundingId(id);
    try {
      const { requestRefund } = await import("@/lib/applications.functions");
      const res = await requestRefund({
        data: { applicationId: id, email, password },
      });
      if (res.alreadyRequested) {
        toast.info("이미 환불이 요청된 신청입니다.");
      } else if (res.refunded) {
        toast.success("환불이 완료되었습니다.");
      } else {
        toast.success("환불 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.");
      }
      setResults(
        (r) =>
          r?.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: res.refunded ? "refunded" : "refund_requested",
                }
              : a,
          ) ?? null,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "환불 요청 실패");
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-surface">
        <DialogHeader>
          <DialogTitle>신청 조회</DialogTitle>
          <DialogDescription>
            신청 시 입력한 이메일과 비밀번호로 조회하세요.
          </DialogDescription>
        </DialogHeader>

        {!results && (
          <form onSubmit={search} className="space-y-4">
            <Field label="이메일">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="비밀번호">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-neon text-neon-foreground hover:bg-neon/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 조회 중...
                </>
              ) : (
                "조회"
              )}
            </Button>
          </form>
        )}

        {results && (
          <div className="space-y-3">
            {results.map((a) => {
              const c = CLASS_OPTIONS.find((x) => x.key === a.class_key);
              const paymentLabel =
                a.payment_method === "card"
                  ? "카드결제"
                  : a.payment_method === "kakaopay"
                    ? "카카오페이"
                    : "무통장입금";
              const canRefund =
                a.status !== "refunded" && a.status !== "refund_requested";
              return (
                <div
                  key={a.id}
                  className="rounded-lg border border-border bg-background/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{c?.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {a.schedule}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {paymentLabel} · {a.amount.toLocaleString()}원
                      </div>
                    </div>
                    <StatusPill status={a.status} />
                  </div>
                  {canRefund && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={refundingId === a.id}
                      onClick={() => refund(a.id)}
                      className="mt-3 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {refundingId === a.id ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{" "}
                          처리 중...
                        </>
                      ) : (
                        "환불 신청"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              * 일정 변경은 취소 후 재신청만 가능합니다.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={reset} className="w-full">
                다시 조회
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string; cls: string }> = {
    pending: { label: "결제 대기", cls: "bg-yellow-500/15 text-yellow-400" },
    bank_pending: {
      label: "입금 대기",
      cls: "bg-yellow-500/15 text-yellow-400",
    },
    paid: { label: "결제 완료", cls: "bg-neon/15 text-neon" },
    failed: { label: "결제 실패", cls: "bg-destructive/15 text-destructive" },
    refund_requested: {
      label: "환불 요청됨",
      cls: "bg-orange-500/15 text-orange-400",
    },
    refunded: { label: "환불 완료", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${m.cls}`}>
      {m.label}

    </span>
  );
}

/* -------------------- FOOTER -------------------- */
function Footer() {
  return (
    <footer className="border-t border-border/50 bg-surface/30 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-neon text-neon-foreground">
                <Film className="h-4 w-4" />
              </span>
              <span className="font-script text-2xl text-neon">862 Academy</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              영화를 배운 다음의 이야기
            </p>
          </div>

          <div className="text-sm">
            <div className="mb-4 font-medium text-foreground">Contact Us</div>
            <a
              href="https://41ev6.channel.io/home"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-neon"
            >
              <span>📧</span> 문의하기
            </a>
            <a
              href="mailto:f862@flim862.com"
              className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-neon"
            >
              <Mail className="h-4 w-4" /> f862@flim862.com
            </a>
          </div>

          <div className="text-sm">
            <div className="mb-4 font-medium text-foreground">Information</div>
            <p className="text-muted-foreground">주식회사 에프팔육이 | 대표 최지원</p>
            <p className="mt-2 text-muted-foreground">📞 0507-1411-5737</p>
            <p className="mt-2 text-muted-foreground">
              📍 경기도 성남시 분당구 판교로289번길 20 판교스타트업캠퍼스 3동 1층 키움 09
            </p>
            <p className="mt-2 text-muted-foreground">사업자등록번호 439-87-03211</p>
            <p className="text-muted-foreground">통신판매업 신고번호 제 2024-성남분당A-0401호</p>
          </div>
        </div>

        <div className="mx-auto mt-10 flex flex-col gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=4398703211"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neon"
            >
              [사업자정보확인]
            </a>
            <span className="hidden sm:inline">|</span>
            <a href="#" className="hover:text-neon">이용약관</a>
            <span className="hidden sm:inline">|</span>
            <a href="#" className="hover:text-neon">개인정보처리방침</a>
          </div>
          <div>© f862 Inc. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  );
}
