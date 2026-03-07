import { AgentDispatchClient, EgressClient, RoomServiceClient, SipClient } from "livekit-server-sdk";

import { env } from "@/lib/env";

export function getRoomServiceClient() {
  return new RoomServiceClient(env.livekitUrl, env.livekitApiKey, env.livekitApiSecret);
}

export function getSipClient() {
  return new SipClient(env.livekitUrl, env.livekitApiKey, env.livekitApiSecret);
}

export function getAgentDispatchClient() {
  return new AgentDispatchClient(env.livekitUrl, env.livekitApiKey, env.livekitApiSecret);
}

export function getEgressClient() {
  return new EgressClient(env.livekitUrl, env.livekitApiKey, env.livekitApiSecret);
}
