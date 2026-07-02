"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo-mark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    });

    if (resetError) {
      setError(resetError.message);
      toast.error(resetError.message || "Could not send the reset link. Please try again.");
      setLoading(false);
      return;
    }

    setSent(true);
    toast.success("Reset link sent! Check your email.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative" style={{ background: "var(--color-bg-primary)" }}>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <LogoMark className="w-6 h-6" />
          <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Momentum</span>
        </div>
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-success-soft)" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "var(--color-success)" }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Check your email</h1>
            <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/login" className="btn-primary inline-flex"><ArrowLeft className="w-4 h-4" /> Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Reset your password</h1>
            <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" required />
                </div>
              </div>
              <Button type="submit" variant="primary" loading={loading} className="w-full py-3">
                {!loading && "Send Reset Link"}
              </Button>
            </form>
            <Link href="/login" className="flex items-center gap-2 justify-center mt-6 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
