import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAgencyContext } from "@/lib/auth";
import { startOutboundCall } from "@/lib/calls";
import { demoApiResponse } from "@/lib/demo";
import { hasLivekitEnv, hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  leadId: z.string().uuid(),
  sipConfigId: z.string().uuid(),
  retryOf: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAuthEnv() || !hasLivekitEnv()) {
      return jsonError("Calling is not configured on this deployment.", 503);
    }

    if (isDemoMode()) {
      const payload = requestSchema.parse(await request.json());
      return NextResponse.json(
        demoApiResponse({
          success: true,
          callId: `demo-${payload.leadId}`,
          roomName: "demo-room",
        }),
      );
    }

    const actor = await requireAgencyContext();
    const payload = requestSchema.parse(await request.json());
    const supabase = createAdminClient();

    const [{ data: lead, error: leadError }, { data: sipConfig, error: sipError }] =
      await Promise.all([
        supabase
          .from("leads")
          .select("id, agency_id, first_name, phone, campaign_type, status, do_not_call_before")
          .eq("id", payload.leadId)
          .eq("agency_id", actor.agencyId)
          .single(),
        supabase
          .from("sip_configurations")
          .select("id, agency_id, livekit_outbound_trunk_id, vobiz_sip_domain, phone_number, is_active")
          .eq("id", payload.sipConfigId)
          .eq("agency_id", actor.agencyId)
          .single(),
      ]);

    if (leadError || !lead) {
      return jsonError("Lead not found", 404);
    }

    if (sipError || !sipConfig) {
      return jsonError("SIP configuration not found", 404);
    }

    if (!sipConfig.is_active) {
      return jsonError("SIP configuration is inactive", 409);
    }

    const result = await startOutboundCall({
      lead,
      sipConfig,
      retryOf: payload.retryOf,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("[api/calls/initiate] failed", {
      error: error instanceof Error ? error.message : "Unexpected error",
    });

    if (error instanceof z.ZodError) {
      return jsonError(error.issues.map((issue) => issue.message).join(", "), 422);
    }

    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
