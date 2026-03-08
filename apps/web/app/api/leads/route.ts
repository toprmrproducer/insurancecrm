import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAgencyContext } from "@/lib/auth";
import { hasSupabaseAuthEnv } from "@/lib/env";
import { normalizeStoredPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  campaignType: z.enum(["appointment_setter", "renewal_reminder"]),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAuthEnv()) {
      return jsonError("Lead management is not configured on this deployment.", 503);
    }

    const actor = await requireAgencyContext();
    const payload = createLeadSchema.parse(await request.json());
    const phone = normalizeStoredPhone(payload.phone);

    if (phone.length < 11) {
      return jsonError("Enter a valid phone number.", 422);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .upsert(
        {
          agency_id: actor.agencyId,
          first_name: payload.firstName.trim(),
          last_name: payload.lastName?.trim() || null,
          phone,
          email: payload.email?.trim() || null,
          city: payload.city?.trim() || null,
          state: payload.state?.trim() || null,
          zip: payload.zip?.trim() || null,
          campaign_type: payload.campaignType,
          notes: payload.notes?.trim() || null,
          status: "new",
        },
        {
          onConflict: "agency_id,phone",
        },
      )
      .select("id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to save lead.", 500);
    }

    return NextResponse.json({
      success: true,
      leadId: data.id,
      message: "Lead saved.",
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
