import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SIPMediaEncryption, SIPTransport } from "@livekit/protocol";

import { isAdmin, jsonError, requireAgencyContext } from "@/lib/auth";
import { hasLivekitEnv, hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";
import { normalizeStoredPhone } from "@/lib/phone";
import { getSipClient } from "@/lib/livekit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  label: z.string().min(1),
  vobizTrunkId: z.string().min(1).optional().nullable(),
  vobizSipDomain: z.string().min(1),
  vobizUsername: z.string().min(1),
  vobizPassword: z.string().min(1),
  phoneNumber: z.string().min(7),
});

export async function GET() {
  try {
    if (!hasSupabaseAuthEnv() || !hasLivekitEnv()) {
      return jsonError("SIP configuration is not available on this deployment.", 503);
    }

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        sipConfigs: [
          {
            id: "demo-main",
            label: "Main Line",
            phone_number: "+13125550182",
            vobiz_sip_domain: "5f3a607b.sip.vobiz.ai",
            livekit_outbound_trunk_id: "ST_demo_outbound",
            livekit_inbound_trunk_id: "ST_demo_inbound",
            is_active: true,
          },
        ],
      });
    }

    const actor = await requireAgencyContext();
    if (!isAdmin(actor.role)) {
      return jsonError("Admin access required", 403);
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("sip_configurations")
      .select(
        "id, label, phone_number, vobiz_sip_domain, livekit_outbound_trunk_id, livekit_inbound_trunk_id, is_active",
      )
      .eq("agency_id", actor.agencyId)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ success: true, sipConfigs: data ?? [] });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAuthEnv() || !hasLivekitEnv()) {
      return jsonError("SIP configuration is not available on this deployment.", 503);
    }

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
    const phoneNumber = normalizeStoredPhone(payload.phoneNumber);

    if (phoneNumber.length < 11) {
      return jsonError("Enter a valid DID / phone number for the SIP line.", 422);
    }

    const outboundTrunk = await sipClient.createSipOutboundTrunk(
      `${payload.label} Outbound`,
      payload.vobizSipDomain,
      [phoneNumber],
      {
        authUsername: payload.vobizUsername,
        authPassword: payload.vobizPassword,
        transport: SIPTransport.SIP_TRANSPORT_UDP,
        mediaEncryption: SIPMediaEncryption.SIP_MEDIA_ENCRYPT_DISABLE,
      },
    );

    const inboundTrunk = await sipClient.createSipInboundTrunk(
      `${payload.label} Inbound`,
      [phoneNumber],
      {
        mediaEncryption: SIPMediaEncryption.SIP_MEDIA_ENCRYPT_DISABLE,
      },
    );

    const supabase = await createServerSupabaseClient();
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
        phone_number: phoneNumber,
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
