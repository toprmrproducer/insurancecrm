import { randomUUID } from "node:crypto";

import { normalizeStoredPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAgentDispatchClient, getRoomServiceClient, getSipClient } from "@/lib/livekit";

export type LeadRecord = {
  id: string;
  agency_id: string;
  first_name: string;
  phone: string;
  campaign_type: "appointment_setter" | "renewal_reminder" | null;
  status: string;
  do_not_call_before: string | null;
};

export type SipConfigRecord = {
  id: string;
  livekit_outbound_trunk_id: string | null;
  vobiz_sip_domain: string | null;
  phone_number?: string | null;
};

type StartOutboundCallInput = {
  lead: LeadRecord;
  sipConfig: SipConfigRecord;
  retryOf?: string | null;
};

export async function startOutboundCall({ lead, sipConfig, retryOf }: StartOutboundCallInput) {
  if (!sipConfig.livekit_outbound_trunk_id) {
    throw new Error("SIP configuration is missing a LiveKit outbound trunk id");
  }

  if (lead.status === "dnc") {
    throw new Error("Lead is marked as DNC");
  }

  if (lead.do_not_call_before && new Date(lead.do_not_call_before) > new Date()) {
    throw new Error("Lead is not callable yet");
  }

  const supabase = createAdminClient();
  const roomServiceClient = getRoomServiceClient();
  const agentDispatchClient = getAgentDispatchClient();
  const sipClient = getSipClient();
  const roomName = `call-${randomUUID()}`;
  const dialNumber = normalizeStoredPhone(lead.phone);
  const fromNumber = normalizeStoredPhone(sipConfig.phone_number);

  if (dialNumber.length < 11) {
    throw new Error("Lead phone number is not dialable.");
  }

  const { data: call, error: insertError } = await supabase
    .from("calls")
    .insert({
      agency_id: lead.agency_id,
      lead_id: lead.id,
      sip_config_id: sipConfig.id,
      livekit_room_name: roomName,
      campaign_type: lead.campaign_type,
      direction: "outbound",
      status: "initiated",
      retry_of: retryOf ?? null,
      analysis_status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !call) {
    throw new Error(insertError?.message ?? "Failed to create call record");
  }

  const metadata = JSON.stringify({
    callId: call.id,
    leadId: lead.id,
  });

  try {
    await roomServiceClient.createRoom({
      name: roomName,
      metadata,
      emptyTimeout: 300,
      maxParticipants: 3,
    });

    await agentDispatchClient.createDispatch(roomName, "insurance-agent", {
      metadata,
    });

    await sipClient.createSipParticipant(
      sipConfig.livekit_outbound_trunk_id,
      dialNumber,
      roomName,
      {
        participantIdentity: `lead-${lead.id}`,
        participantName: lead.first_name,
        participantMetadata: metadata,
        fromNumber: fromNumber || undefined,
      },
    );
  } catch (error) {
    await supabase
      .from("calls")
      .update({
        status: "failed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", call.id);

    throw error;
  }

  return {
    callId: call.id,
    roomName,
  };
}
