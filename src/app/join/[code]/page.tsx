"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { joinGroupByInvite } from "@/lib/dal/groups";
import { Spinner } from "@/components/ui";
import { toast } from "sonner";

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Not signed in — stash the invite and resume after auth (see dashboard layout).
      if (!user) {
        try {
          localStorage.setItem("pendingInvite", code);
        } catch {
          // ignore storage errors
        }
        router.replace("/signup");
        return;
      }

      try {
        const groupId = await joinGroupByInvite(code);
        if (cancelled) return;
        toast.success("You've joined the group!");
        router.replace(`/groups/${groupId}`);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "";
        if (msg === "Already a member") {
          toast.info("You're already in this group.");
        } else if (msg === "Invalid invite code") {
          toast.error("That invite link is invalid or has expired.");
        } else {
          toast.error("Couldn't join the group. Please try again.");
        }
        router.replace("/groups");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--color-bg-primary)" }}>
      <Spinner size="lg" />
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Joining group…</p>
    </div>
  );
}
