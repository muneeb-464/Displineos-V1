import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BarChart3, Calendar, ClipboardList, NotebookPen, Shield } from "lucide-react";

const FEATURES = [
  { icon: Calendar, label: "Daily Planner", desc: "Plan your hours with time blocks" },
  { icon: ClipboardList, label: "Activity Log", desc: "Track what you actually did" },
  { icon: BarChart3, label: "Analytics", desc: "Visualize your weekly trends" },
  { icon: NotebookPen, label: "Reflections", desc: "Journal your wins and lessons" },
];

export default function LoginPage() {
  const { isLoggedIn, isLoading, signInWithGoogle, enterGuestMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isLoggedIn) navigate("/dashboard", { replace: true });
  }, [isLoggedIn, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left panel — branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary/5 border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center shadow-md shadow-primary/30">
            <div className="h-2.5 w-2.5 rounded-sm bg-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">DisciplineOS</span>
        </div>

        <div>
          <p className="text-4xl font-display font-bold leading-tight mb-3">
            Build discipline.<br />Track progress.<br />Win every day.
          </p>
          <p className="text-muted-foreground text-sm max-w-xs">
            A personal productivity system built around deep work, Islamic prayer tracking, and daily scoring.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-xl border border-border bg-background/50 p-4">
              <Icon className="h-5 w-5 text-primary mb-2" />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — sign in form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center shadow-md shadow-primary/30">
              <div className="h-2.5 w-2.5 rounded-sm bg-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">DisciplineOS</span>
          </div>

          <h1 className="font-display text-3xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your account to continue</p>

          {/* Google sign in */}
          <button
            onClick={signInWithGoogle}
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-5 py-3.5 text-sm font-medium shadow-sm transition hover:bg-accent active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Guest mode */}
          <button
            onClick={() => { enterGuestMode(); navigate("/"); }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground active:scale-95"
          >
            Browse as guest
          </button>

          <div className="mt-8 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <p>Your data is encrypted and synced securely via Google OAuth. We never store your password.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
