import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SIPTransport } from "@livekit/protocol";

import { isAdmin, jsonError, requireAgencyContext } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { getSipClient } from "@/lib/livekit";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  label: z.string().min(1),
  vobizTrunkId: z.string().min(1).optional().nullable(),
  vobizSipDomain: z.string().min(1),
  vobizUsername: z.string().min(1),
  vobizPassword: z.string().min(1),
  phoneNumber: z.string().min(7),
});

export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      const payload = requestSchema.parse(await request.json());
      return NextResponse.json({
        success: true,
        sipConfig: {
          id: "demo-sip-config",
          label: payload.label,
          livekit_outbound_trunk_id: "ST_demo_outbound",
          livekit_inbound_trunk_id: "ST_demo_inbound",
        },
      });
    }

    const actor = await requireAgencyContext();
    const sipClient = getSipClient();

    if (!isAdmin(actor.role)) {
      return jsonError("Admin access required", 403);
    }

    const payload = requestSchema.parse(await request.json());

    const outboundTrunk = await sipClient.createSipOutboundTrunk(
      `${payload.label} Outbound`,
      payload.vobizSipDomain,
      [payload.phoneNumber],
      {
        authUsername: payload.vobizUsername,
        authPassword: payload.vobizPassword,
        transport: SIPTransport.SIP_TRANSPORT_UDP,
      },
    );

    const inboundTrunk = await sipClient.createSipInboundTrunk(`${payload.label} Inbound`, [
      payload.phoneNumber,
    ]);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("sip_configurations")
      .insert({
        agency_id: actor.agencyId,
        label: payload.label,
        vobiz_trunk_id: payload.vobizTrunkId ?? null,
        vobiz_sip_domain: payload.vobizSipDomain,
        vobiz_username: payload.vobizUsername,
        vobiz_password: payload.vobizPassword,
        livekit_outbound_trunk_id: outboundTrunk.sipTrunkId,
        livekit_inbound_trunk_id: inboundTrunk.sipTrunkId,
        phone_number: payload.phoneNumber,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      sipConfig: data,
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
