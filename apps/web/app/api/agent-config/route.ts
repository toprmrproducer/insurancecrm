import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdmin, jsonError, requireAgencyContext } from "@/lib/auth";
import { hasSupabaseAuthEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const defaultPrompts = {
  appointment_setter: {
    campaign_type: "appointment_setter",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    voice: "Aoede",
    agent_name: "Mia",
    first_line:
      "Hi, this is Mia with Raj's Insurance. I’m just calling to help you schedule your follow-up.",
    prompt:
      "You are Mia, a warm appointment-setting assistant for Raj's Insurance. Verify the prospect's basic details, handle compliance requests, and secure a firm appointment time with a licensed agent. Do not sell insurance or quote products.",
  },
  renewal_reminder: {
    campaign_type: "renewal_reminder",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    voice: "Aoede",
    agent_name: "Ava",
    first_line:
      "Hi, this is Ava with Raj's Insurance. I’m calling to review your current draft and see if you need anything adjusted.",
    prompt:
      "You are Ava, a calm renewal reminder assistant for Raj's Insurance. Confirm draft comfort, detect objections, handle compliance requests, and offer a warm transfer when the customer wants live help or more coverage.",
  },
} as const;

const configSchema = z.object({
  campaignType: z.enum(["appointment_setter", "renewal_reminder"]),
  model: z.string().min(1),
  voice: z.string().min(1),
  agentName: z.string().min(1),
  firstLine: z.string().min(1),
  prompt: z.string().min(20),
});

export async function GET() {
  try {
    if (!hasSupabaseAuthEnv()) {
      return jsonError("Agent configuration is not available on this deployment.", 503);
    }

    const actor = await requireAgencyContext();
    if (!isAdmin(actor.role)) {
      return jsonError("Admin access required", 403);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("agent_configurations")
      .select("campaign_type, model, voice, agent_name, first_line, prompt, is_active")
      .eq("agency_id", actor.agencyId);

    if (error) {
      if (error.message.includes("agent_configurations")) {
        return NextResponse.json({
          success: true,
          configs: ["appointment_setter", "renewal_reminder"].map((campaignType) => {
            const fallback = defaultPrompts[campaignType as keyof typeof defaultPrompts];
            return {
              campaignType,
              model: fallback.model,
              voice: fallback.voice,
              agentName: fallback.agent_name,
              firstLine: fallback.first_line,
              prompt: fallback.prompt,
              isActive: true,
            };
          }),
          warning: "Run the agent_configurations migration to persist changes.",
        });
      }
      return jsonError(error.message, 500);
    }

    const merged = ["appointment_setter", "renewal_reminder"].map((campaignType) => {
      const saved = data?.find((item) => item.campaign_type === campaignType);
      const fallback = defaultPrompts[campaignType as keyof typeof defaultPrompts];

      return {
        campaignType,
        model: saved?.model ?? fallback.model,
        voice: saved?.voice ?? fallback.voice,
        agentName: saved?.agent_name ?? fallback.agent_name,
        firstLine: saved?.first_line ?? fallback.first_line,
        prompt: saved?.prompt ?? fallback.prompt,
        isActive: saved?.is_active ?? true,
      };
    });

    return NextResponse.json({ success: true, configs: merged });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return jsonError(error instanceof Error ? error.message : "Unexpected error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAuthEnv()) {
      return jsonError("Agent configuration is not available on this deployment.", 503);
    }

    const actor = await requireAgencyContext();
    if (!isAdmin(actor.role)) {
      return jsonError("Admin access required", 403);
    }

    const payload = configSchema.parse(await request.json());
    const supabase = createAdminClient();
    const { error } = await supabase.from("agent_configurations").upsert(
      {
        agency_id: actor.agencyId,
        campaign_type: payload.campaignType,
        model: payload.model,
        voice: payload.voice,
        agent_name: payload.agentName,
        first_line: payload.firstLine,
        prompt: payload.prompt,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "agency_id,campaign_type",
      },
    );

    if (error) {
      if (error.message.includes("agent_configurations")) {
        return jsonError("Run the agent_configurations migration in Supabase before saving agent settings.", 503);
      }
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      message: "Agent configuration saved.",
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
