import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAgencyContext } from "@/lib/auth";
import { hasSupabaseAuthEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const createOrderSchema = z.object({
  title: z.string().min(1),
  leadId: z.string().uuid().optional().nullable(),
  amount: z.number().nonnegative().optional().nullable(),
  status: z.enum(["new", "processing", "completed", "cancelled", "refunded"]).default("new"),
  source: z.string().max(64).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAuthEnv()) {
      return jsonError("Order management is not configured on this deployment.", 503);
    }

    const actor = await requireAgencyContext();
    const payload = createOrderSchema.parse(await request.json());
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        agency_id: actor.agencyId,
        lead_id: payload.leadId ?? null,
        title: payload.title.trim(),
        amount: payload.amount ?? null,
        status: payload.status,
        source: payload.source?.trim() || null,
        notes: payload.notes?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Unable to create order.", 500);
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      message: "Order created.",
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
