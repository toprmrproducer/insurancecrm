import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type AnalysisResult = {
  sentiment: "positive" | "neutral" | "negative";
  outcome:
    | "appointment_booked"
    | "transferred"
    | "not_interested"
    | "dnc"
    | "callback_scheduled"
    | "voicemail"
    | "ineligible";
  appointment_time: string | null;
  comfort_with_premium: boolean | null;
  comfort_monthly: boolean | null;
  wants_more_coverage: boolean | null;
  recommended_action: "agent_callback" | "follow_up" | "close" | "dnc" | "no_action";
  summary: string;
  should_continue_calling: boolean;
};

type CallWebhookRecord = {
  id?: string;
  status?: string;
  transcript?: string;
  lead_id?: string;
  analysis_status?: string;
  analysis_retries?: number;
};

type CallWebhookBody = {
  record?: CallWebhookRecord;
};

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase function is missing required environment variables");
}

serve(async (request) => {
  let body: CallWebhookBody | null = null;

  try {
    body = await request.json();
    const record = body.record;

    if (!record?.id || record.status !== "completed" || !record.transcript) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (record.analysis_status === "done") {
      return new Response(JSON.stringify({ skipped: true, reason: "already-analyzed" }), {
        status: 200,
      });
    }

    await supabase
      .from("calls")
      .update({ analysis_status: "processing" })
      .eq("id", record.id);

    const prompt = `
You are an insurance CRM analyst. Analyze the transcript and return only valid JSON.

Transcript:
${record.transcript}

JSON shape:
{
  "sentiment": "positive" | "neutral" | "negative",
  "outcome": "appointment_booked" | "transferred" | "not_interested" | "dnc" | "callback_scheduled" | "voicemail" | "ineligible",
  "appointment_time": "string or null",
  "comfort_with_premium": true | false | null,
  "comfort_monthly": true | false | null,
  "wants_more_coverage": true | false | null,
  "recommended_action": "agent_callback" | "follow_up" | "close" | "dnc" | "no_action",
  "summary": "Two sentence summary",
  "should_continue_calling": true | false
}
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini request failed with ${geminiResponse.status}`);
    }

    const geminiPayload = await geminiResponse.json();
    const rawText = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini response did not contain a JSON payload");
    }

    const analysis = JSON.parse(rawText) as AnalysisResult;

    await supabase.from("call_analysis").upsert(
      {
        call_id: record.id,
        lead_id: record.lead_id,
        ...analysis,
        raw_analysis: analysis,
      },
      {
        onConflict: "call_id",
      },
    );

    await supabase
      .from("leads")
      .update({
        status:
          analysis.outcome === "dnc"
            ? "dnc"
            : analysis.outcome === "appointment_booked"
              ? "appointment_booked"
              : analysis.outcome === "transferred"
                ? "transferred"
                : analysis.outcome === "callback_scheduled"
                  ? "callback_scheduled"
                  : "called",
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", record.lead_id);

    await supabase
      .from("calls")
      .update({ analysis_status: "done" })
      .eq("id", record.id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const recordId = body?.record?.id;

    if (recordId) {
      const nextRetries =
        typeof body.record?.analysis_retries === "number" ? body.record.analysis_retries + 1 : 1;
      await supabase
        .from("calls")
        .update({
          analysis_status: "failed",
          analysis_retries: nextRetries,
        })
        .eq("id", recordId);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      { status: 500 },
    );
  }
});
