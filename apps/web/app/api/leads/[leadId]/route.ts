import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAgencyContext } from "@/lib/auth";
import { hasSupabaseAuthEnv } from "@/lib/env";
import { normalizeStoredPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

const updateLeadSchema = z.object({
  status: z
    .enum([
      "new",
      "called",
      "callback_scheduled",
      "appointment_booked",
      "not_interested",
      "dnc",
      "transferred",
      "ineligible",
    ])
    .optional(),
  campaignType: z.enum(["appointment_setter", "renewal_reminder"]).optional(),
  notes: z.string().optional().nullable(),
  phone: z.string().optional(),
  nextFollowupAt: z.string().datetime().optional().nullable(),
});

type RouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!hasSupabaseAuthEnv()) {
      return jsonError("Lead management is not configured on this deployment.", 503);
    }

    const actor = await requireAgencyContext();
    const { leadId } = await context.params;
    const payload = updateLeadSchema.parse(await request.json());
    const updates: Record<string, string | null> = {};

    if (payload.status) {
      updates.status = payload.status;
      updates.last_contacted_at =
        payload.status === "called" || payload.status === "dnc" || payload.status === "transferred"
          ? new Date().toISOString()
          : null;
    }

    if (payload.campaignType) {
      updates.campaign_type = payload.campaignType;
    }

    if (payload.notes !== undefined) {
      updates.notes = payload.notes?.trim() || null;
    }

    if (payload.phone) {
      const normalizedPhone = normalizeStoredPhone(payload.phone);
      if (normalizedPhone.length < 11) {
        return jsonError("Enter a valid phone number.", 422);
      }
      updates.phone = normalizedPhone;
    }

    if (payload.nextFollowupAt !== undefined) {
      updates.next_followup_at = payload.nextFollowupAt ?? null;
      updates.do_not_call_before = payload.nextFollowupAt ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No lead updates provided.", 422);
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", leadId)
      .eq("agency_id", actor.agencyId);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      message: "Lead updated.",
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
