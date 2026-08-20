import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2, X, LogIn, UserPlus } from "lucide-react";
import desertSunsetBg from "@/assets/desert-sunset-bg.jpg";
import { BusinessProfileStep } from "@/components/auth/signup-scope-steps";
import { savePendingScope } from "@/lib/onboarding-scope";
import { EMPTY_CHARACTERISTICS, type BusinessCharacteristics } from "@/lib/business-scope";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in · Bizz Automators" },
      { name: "description", content: "Sign in to Bizz Automators to manage sales, customers, inventory and tax compliance in one place." },
      { property: "og:title", content: "Sign in · Bizz Automators" },
      { property: "og:description", content: "Access your Bizz Automators business workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-amber-400/60";

type Mode = "signin" | "signup" | null;

function AuthDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#0b0d12]/95 text-white shadow-[0_-30px_90px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start gap-3 border-b border-white/[0.07] bg-white/[0.02] px-5 py-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/30 bg-amber-400/10 text-amber-300">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold leading-tight">{title}</h2>
            <p className="mt-0.5 text-sm text-white/55">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupStep, setSignupStep] = useState(1);
  const [characteristics, setCharacteristics] = useState<BusinessCharacteristics>({
    ...EMPTY_CHARACTERISTICS,
    flags: {},
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && signupStep < 2) {
      if (signupStep === 1 && (!fullName.trim() || !email.trim() || password.length < 6)) {
        toast.error("Enter your name, a valid email, and a password of at least 6 characters");
        return;
      }
      if (
        signupStep === 2 &&
        (!characteristics.name.trim() ||
          !characteristics.legalForm.trim() ||
          !characteristics.businessType.trim() ||
          !characteristics.sector.trim() ||
          characteristics.employeeCount === null ||
          characteristics.employeeCount < 0)
      ) {
        toast.error("Complete the required business profile fields");
        return;
      }
      setSignupStep((step) => step + 1);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        savePendingScope({ email, characteristics, plan: "full" });
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
        setSignupStep(1);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
    }
  };

  const form = (
    <>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div className="mb-5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
            {["Account", "Business Profile"].map((label, index) => (
              <span key={label} className={signupStep === index + 1 ? "text-amber-300" : undefined}>
                {index + 1}. {label}
              </span>
            ))}
          </div>
        )}
        {mode === "signup" && signupStep === 1 && (
          <>
            <input
              className={inputCls}
              required
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className={inputCls}
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={inputCls}
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}
        {mode === "signup" && signupStep === 2 && (
          <BusinessProfileStep
            value={characteristics}
            onChange={(patch) => setCharacteristics((current) => ({ ...current, ...patch }))}
          />
        )}
        {mode === "signin" && (
          <>
            <input
              className={inputCls}
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={inputCls}
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}
        {mode === "signup" && (
          <div className="flex gap-2 pt-2">
            {signupStep > 1 && (
              <button
                type="button"
                onClick={() => setSignupStep((step) => step - 1)}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {signupStep === 2 ? "Create account" : "Next"}
            </button>
          </div>
        )}
        {mode === "signin" && (
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        )}
      </form>

      <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-white/40">
        <span className="h-px flex-1 bg-white/15" />or<span className="h-px flex-1 bg-white/15" />
      </div>

      {mode === "signin" && <button
        onClick={google}
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
      >
        Continue with Google
      </button>}

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setSignupStep(1);
        }}
        className="mt-5 w-full text-center text-xs text-white/60 transition hover:text-white"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </>
  );

  return (
    <main className="relative grid min-h-screen place-items-center px-5 py-12 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${desertSunsetBg})`, filter: "brightness(0.5) saturate(0.9)" }}
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-black/40 p-6 text-center backdrop-blur-xl">
        <h1 className="font-display text-2xl font-medium tracking-[0.12em] text-white/90">BIZZ AUTOMATORS</h1>
        <p className="mt-1 text-sm text-white/70">Simplify your business.</p>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => setMode("signin")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
          >
            <UserPlus className="h-4 w-4" />
            Create account
          </button>
        </div>
      </div>

      <AuthDrawer
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === "signup" ? "Create account" : "Sign in"}
        subtitle={mode === "signup" ? "Set up your business workspace" : "Welcome back to your workspace"}
        icon={mode === "signup" ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
      >
        {form}
      </AuthDrawer>
    </main>
  );
}
