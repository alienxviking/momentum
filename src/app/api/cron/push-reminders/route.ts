import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Scheduled (see vercel.json). Sends a web-push nudge to group members who
// haven't logged today's progress and have a push subscription.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PushRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:noreply@momentum.app";

  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceKey],
    ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", vapidPublic],
    ["VAPID_PRIVATE_KEY", vapidPrivate],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    return Response.json({ error: "Missing required environment variables.", missing }, { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic!, vapidPrivate!);
  const supabase = createClient(supabaseUrl!, serviceKey!);

  const { data, error } = await supabase.rpc("push_subscriptions_needing_reminder");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const rows = (data ?? []) as PushRow[];

  const payload = JSON.stringify({
    title: "Keep your momentum going",
    body: "You haven't logged today's progress yet. A quick check-in keeps your streak alive.",
    url: "/progress/submit",
  });

  let sent = 0;
  const stale: string[] = [];

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 404/410 mean the subscription is gone — prune it.
      if (statusCode === 404 || statusCode === 410) {
        stale.push(row.endpoint);
      } else {
        console.error("Push send failed", row.endpoint, err);
      }
    }
  }

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return Response.json({ ok: true, eligible: rows.length, sent, pruned: stale.length });
}
