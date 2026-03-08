import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireAgencyContext } from "@/lib/auth";
import { hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";
import { normalizeStoredPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

const formSchema = z.object({
  campaignType: z.enum(["appointment_setter", "renewal_reminder"]),
});

type RawLeadRow = Record<string, string | undefined>;

function parseCsvDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAuthEnv()) {
      return jsonError("Lead import is not configured on this deployment.", 503);
    }

    if (isDemoMode()) {
      return NextResponse.json({ success: true, imported: 12, total: 12, skipped: 0, demo: true });
    }

    const actor = await requireAgencyContext();
    const formData = await request.formData();
    const file = formData.get("file");
    const campaignType = formData.get("campaignType");

    if (!(file instanceof File)) {
      return jsonError("Missing file upload", 422);
    }

    const parsedForm = formSchema.parse({ campaignType });
    const csv = await file.text();
    const { data } = Papa.parse<RawLeadRow>(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    const leads = data
      .map((row) => {
        const fullName = row.name?.trim();
        const [firstFromFull = "", ...rest] = fullName ? fullName.split(/\s+/) : [];
        const phone = normalizeStoredPhone(
          row.phone ??
            row.phone_number ??
            row.mobile ??
            row.mobile_number ??
            row.cell ??
            row.telephone ??
            row.tel,
        );
        const transferNumber = normalizeStoredPhone(row.transfer_number ?? row.transfer_phone);

        return {
          agency_id: actor.agencyId,
          first_name: row.first_name?.trim() || row.firstname?.trim() || firstFromFull,
          last_name: row.last_name?.trim() || row.lastname?.trim() || rest.join(" "),
          phone,
          email: row.email?.trim() || null,
          campaign_type: parsedForm.campaignType,
          city: row.city?.trim() || null,
          state: row.state?.trim() || null,
          zip: row.zip?.trim() || row.zip_code?.trim() || null,
          monthly_premium: row.monthly_premium ? Number.parseFloat(row.monthly_premium) : null,
          draft_date: parseCsvDate(row.draft_date),
          monthly_premium_spoken: row.monthly_premium_spoken?.trim() || null,
          draft_date_spoken: row.draft_date_spoken?.trim() || null,
          transfer_number: transferNumber || null,
          notes: row.notes?.trim() || null,
          status: "new" as const,
        };
      })
      .filter((lead) => lead.first_name && lead.phone.length >= 11);

    if (!leads.length) {
      return jsonError("No valid rows found in CSV", 422);
    }

    const supabase = createAdminClient();
    const { data: imported, error } = await supabase
      .from("leads")
      .upsert(leads, {
        onConflict: "agency_id,phone",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      imported: imported?.length ?? 0,
      total: leads.length,
      skipped: leads.length - (imported?.length ?? 0),
      leadIds: (imported ?? []).map((lead) => lead.id),
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
