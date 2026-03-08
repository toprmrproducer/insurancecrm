import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAgencyContext } from "@/lib/auth";
import { hasSupabaseAuthEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const updateOrderSchema = z.object({
  title: z.string().min(1).optional(),
  leadId: z.string().uuid().optional().nullable(),
  amount: z.number().nonnegative().optional().nullable(),
  status: z.enum(["new", "processing", "completed", "cancelled", "refunded"]).optional(),
  source: z.string().max(64).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!hasSupabaseAuthEnv()) {
      return jsonError("Order management is not configured on this deployment.", 503);
    }

    const actor = await requireAgencyContext();
    const { orderId } = await context.params;
    const payload = updateOrderSchema.parse(await request.json());
    const updates: Record<string, string | number | null> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) {
      updates.title = payload.title.trim();
    }
    if (payload.leadId !== undefined) {
      updates.lead_id = payload.leadId ?? null;
    }
    if (payload.amount !== undefined) {
      updates.amount = payload.amount ?? null;
    }
    if (payload.status !== undefined) {
      updates.status = payload.status;
    }
    if (payload.source !== undefined) {
      updates.source = payload.source?.trim() || null;
    }
    if (payload.notes !== undefined) {
      updates.notes = payload.notes?.trim() || null;
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .eq("agency_id", actor.agencyId);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      message: "Order updated.",
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
