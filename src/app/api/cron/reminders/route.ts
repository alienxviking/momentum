import { createClient } from "@supabase/supabase-js";

// Runs on a schedule (see vercel.json). Emails group members who haven't
// logged today's progress and still have reminders enabled.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Recipient {
  user_id: string;
  email: string;
  full_name: string | null;
}

function reminderEmail(name: string | null, appUrl: string): string {
  const firstName = (name || "").trim().split(" ")[0] || "there";
  const submitUrl = `${appUrl}/progress/submit`;
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#050a08;padding:40px 24px;color:#e9f2ed">
    <div style="max-width:480px;margin:0 auto;background:#0a1310;border:1px solid rgba(52,211,153,0.14);border-radius:16px;padding:32px">
      <div style="font-size:20px;font-weight:700;margin-bottom:16px">Momentum</div>
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px">Keep your streak alive, ${firstName} 👋</h1>
      <p style="color:#9db3aa;font-size:15px;line-height:1.6;margin:0 0 24px">
        You haven't logged today's progress yet. A quick check-in keeps your
        accountability score up and your group in the loop.
      </p>
      <a href="${submitUrl}"
        style="display:inline-block;background:linear-gradient(100deg,#059669,#06b6d4);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:12px">
        Log today's progress →
      </a>
      <p style="color:#63776f;font-size:12px;margin:28px 0 0">
        Don't want these? Turn off email reminders in your
        <a href="${appUrl}/profile" style="color:#34d399">profile settings</a>.
      </p>
    </div>
  </div>`;
}

export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REMINDER_FROM_EMAIL;

  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceKey],
    ["RESEND_API_KEY", resendKey],
    ["REMINDER_FROM_EMAIL", fromEmail],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    return Response.json(
      { error: "Missing required environment variables.", missing },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  // Non-null: the `missing` check above guarantees these are set.
  const supabase = createClient(supabaseUrl!, serviceKey!);

  const { data, error } = await supabase.rpc("users_needing_reminder");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const recipients = (data ?? []) as Recipient[];

  let sent = 0;
  const failures: string[] = [];

  for (const r of recipients) {
    if (!r.email) continue;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: r.email,
        subject: "Keep your momentum — log today's progress",
        html: reminderEmail(r.full_name, appUrl),
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      failures.push(`${r.email}: ${res.status}`);
      console.error("Resend send failed", r.email, await res.text());
    }
  }

  return Response.json({ ok: true, eligible: recipients.length, sent, failures });
}
