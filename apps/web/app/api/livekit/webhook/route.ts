import { EgressStatus, WebhookReceiver } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

import { env, hasLivekitEnv, hasSupabaseAuthEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

function getAuthHeader(request: NextRequest) {
  return request.headers.get("Authorization") ?? request.headers.get("Authorize") ?? undefined;
}

function recordingStatusFromEgress(status: number) {
  if (status === EgressStatus.EGRESS_COMPLETE) {
    return "completed";
  }

  if (
    status === EgressStatus.EGRESS_FAILED ||
    status === EgressStatus.EGRESS_ABORTED ||
    status === EgressStatus.EGRESS_LIMIT_REACHED
  ) {
    return "failed";
  }

  return "recording";
}

export async function POST(request: NextRequest) {
  try {
    if (!hasLivekitEnv() || !hasSupabaseAuthEnv()) {
      return NextResponse.json({ error: "Webhook service is not configured." }, { status: 503 });
    }

    const body = await request.text();
    const receiver = new WebhookReceiver(env.livekitApiKey, env.livekitApiSecret);
    const event = await receiver.receive(body, getAuthHeader(request));
    const egressInfo = event.egressInfo;

    if (!egressInfo) {
      return NextResponse.json({ ok: true, ignored: "no-egress-info" });
    }

    const supabase = createAdminClient();
    const resolvedStatus = recordingStatusFromEgress(egressInfo.status);
    const fileResult = egressInfo.fileResults?.[0];
    const recordingReference = fileResult?.location || fileResult?.filename || null;

    const { data: updatedCalls } = await supabase
      .from("calls")
      .update({
        livekit_egress_id: egressInfo.egressId || null,
        recording_status: resolvedStatus,
        recording_error: egressInfo.error ? egressInfo.error.slice(0, 1024) : null,
        recording_url: recordingReference,
      })
      .eq("livekit_room_name", egressInfo.roomName)
      .select("id");

    if (!updatedCalls?.length && egressInfo.egressId) {
      await supabase
        .from("calls")
        .update({
          livekit_egress_id: egressInfo.egressId,
          recording_status: resolvedStatus,
          recording_error: egressInfo.error ? egressInfo.error.slice(0, 1024) : null,
          recording_url: recordingReference,
        })
        .eq("livekit_egress_id", egressInfo.egressId);
    }

    return NextResponse.json({ ok: true, event: event.event });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid webhook payload",
      },
      { status: 400 },
    );
  }
}
