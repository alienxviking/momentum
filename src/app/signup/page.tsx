"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo-mark";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: email.split("@")[0],
        },
      },
    });

    if (authError) {
      setError(authError.message);
      toast.error(authError.message || "Could not create your account. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    toast.success("Account created! Check your email to confirm.");
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative" style={{ background: "var(--color-bg-primary)" }}>
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Check your email</h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          <Link href="/login" className="btn-secondary mt-6 inline-block">Back to Login</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative" style={{ background: "var(--color-bg-primary)" }}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Left Side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, var(--color-bg-secondary), var(--color-bg-tertiary))" }}>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: "#059669" }} />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full opacity-20 blur-3xl" style={{ background: "#06b6d4" }} />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <LogoMark className="w-9 h-9" />
            <span className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>Momentum</span>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Start your journey today.</h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Track habits, build streaks, and hold each other accountable with your group.
          </p>
          <div className="mt-12 space-y-4">
            {[{ emoji: "🎯", text: "Set and track daily habits" }, { emoji: "👥", text: "Join accountability groups" }, { emoji: "📈", text: "Visualize your progress" }].map((item) => (
              <div key={item.text} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(5, 150, 105, 0.1)", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <LogoMark className="w-6 h-6" />
            <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Momentum</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Create your account</h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--color-accent-primary)" }}>Log in</Link>
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          <button onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-default)", color: "var(--color-text-primary)" }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--color-border-default)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border-default)" }} />
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="input-field pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field pl-10 pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="primary" loading={loading} className="w-full py-3 mt-2">
              {!loading && <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
