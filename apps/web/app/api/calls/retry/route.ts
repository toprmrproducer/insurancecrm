import { NextRequest } from "next/server";

import { env, hasLivekitEnv, hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";
import { type LeadRecord, type SipConfigRecord, startOutboundCall } from "@/lib/calls";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorizedCron(request: NextRequest) {
  if (!env.cronSecret) {
    return false;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${env.cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!hasSupabaseAuthEnv() || !hasLivekitEnv()) {
    return new Response("Retry calling is not configured on this deployment.", { status: 503 });
  }

  if (isDemoMode()) {
    return Response.json({ success: true, retried: 0, demo: true });
  }

  if (!isAuthorizedCron(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: failedCalls, error } = await supabase
    .from("calls")
    .select(
      `
        id,
        lead_id,
        sip_config_id,
        retry_count,
        status,
        created_at,
        leads!calls_lead_id_fkey (
          id,
          agency_id,
          first_name,
          phone,
          campaign_type,
          status,
          do_not_call_before
        ),
        sip_configurations!calls_sip_config_id_fkey (
          id,
          livekit_outbound_trunk_id,
          vobiz_sip_domain,
          phone_number
        )
      `,
    )
    .in("status", ["failed", "no_answer"])
    .lt("created_at", thirtyMinutesAgo)
    .lt("retry_count", 3)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  let retried = 0;

  for (const failedCall of failedCalls ?? []) {
    const lead = Array.isArray(failedCall.leads) ? failedCall.leads[0] : failedCall.leads;
    const sipConfig = Array.isArray(failedCall.sip_configurations)
      ? failedCall.sip_configurations[0]
      : failedCall.sip_configurations;

    if (!lead || !sipConfig) {
      continue;
    }

    await startOutboundCall({
      lead: lead as LeadRecord,
      sipConfig: sipConfig as SipConfigRecord,
      retryOf: failedCall.id,
    });

    await supabase
      .from("calls")
      .update({ retry_count: (failedCall.retry_count ?? 0) + 1 })
      .eq("id", failedCall.id);

    retried += 1;
  }

  return Response.json({ success: true, retried });
}
