import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAgencyContext } from "@/lib/auth";
import { startOutboundCall } from "@/lib/calls";
import { demoApiResponse } from "@/lib/demo";
import { hasLivekitEnv, hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  sipConfigId: z.string().uuid(),
  campaignType: z.enum(["appointment_setter", "renewal_reminder"]),
  maxConcurrent: z.number().int().min(1).max(5).default(3),
  limit: z.number().int().min(1).max(100).default(25),
  leadIds: z.array(z.string().uuid()).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAuthEnv() || !hasLivekitEnv()) {
      return jsonError("Campaign calling is not configured on this deployment.", 503);
    }

    if (isDemoMode()) {
      const payload = requestSchema.parse(await request.json());
      return NextResponse.json(
        demoApiResponse({
          success: true,
          initiated: payload.maxConcurrent,
          failed: 0,
          total: payload.limit,
        }),
      );
    }

    const actor = await requireAgencyContext();
    const payload = requestSchema.parse(await request.json());
    const supabase = createAdminClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const sipConfigPromise = supabase
      .from("sip_configurations")
      .select("id, agency_id, livekit_outbound_trunk_id, vobiz_sip_domain, phone_number, is_active")
      .eq("id", payload.sipConfigId)
      .eq("agency_id", actor.agencyId)
      .single();

    const leadQuery = supabase
      .from("leads")
      .select("id, agency_id, first_name, phone, campaign_type, status, do_not_call_before")
      .eq("agency_id", actor.agencyId)
      .eq("campaign_type", payload.campaignType);

    if (payload.leadIds?.length) {
      leadQuery.in("id", payload.leadIds);
    } else {
      leadQuery
        .not("status", "in", '("dnc","appointment_booked","transferred")')
        .or(`last_contacted_at.is.null,last_contacted_at.lt.${sevenDaysAgo}`)
        .order("created_at", { ascending: true })
        .limit(payload.limit);
    }

    const [{ data: sipConfig, error: sipError }, { data: leads, error: leadsError }] =
      await Promise.all([sipConfigPromise, leadQuery]);

    if (sipError || !sipConfig) {
      return jsonError("SIP configuration not found", 404);
    }

    if (!sipConfig.is_active) {
      return jsonError("SIP configuration is inactive", 409);
    }

    if (leadsError) {
      return jsonError(leadsError.message, 500);
    }

    if (!leads?.length) {
      return NextResponse.json({ success: true, initiated: 0, failed: 0, total: 0 });
    }

    let initiated = 0;
    let failed = 0;

    for (let index = 0; index < leads.length; index += payload.maxConcurrent) {
      const batch = leads.slice(index, index + payload.maxConcurrent);

      const results = await Promise.allSettled(
        batch.map((lead) =>
          startOutboundCall({
            lead,
            sipConfig,
          }),
        ),
      );

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          initiated += 1;
        } else {
          failed += 1;
          console.error("[api/campaigns/run] failed lead call", {
            error: result.reason instanceof Error ? result.reason.message : "Unknown error",
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      initiated,
      failed,
      total: leads.length,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    if (error instanceof z.ZodError) {
      return jsonError(error.issues.map((issue) => issue.message).join(", "), 422);
    }

    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}
