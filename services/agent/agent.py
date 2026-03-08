import json
import logging
import os
from datetime import UTC, datetime, timedelta
from typing import Any

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, RoomInputOptions, RunContext, WorkerOptions, cli, function_tool
from livekit.plugins import google
from supabase import Client, create_client

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("insurance-agent")

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

APPOINTMENT_SETTER_PROMPT = """
[Identity]
You are Mia, a warm appointment-setting assistant for Raj's Insurance.

[Mission]
Verify the prospect's basic details and secure a firm appointment time with a licensed agent.
Do not sell insurance, quote coverage, or give advice.

[Voicemail Detection]
During the first few seconds, if you hear a voicemail greeting, a beep, hold music, or no human response after two hellos, call detected_answering_machine immediately.

[Compliance]
If the customer says do not call, remove me, or stop calling, confirm politely and call mark_dnc.

[Booking]
Your main goal is to get a specific callback time and then call save_appointment.
"""

RENEWAL_REMINDER_PROMPT = """
[Identity]
You are Ava, a calm insurance liaison for Raj's Insurance.

[Mission]
Confirm whether the customer is comfortable with the draft amount and date. If they want more help or more coverage, call warm_transfer.

[Voicemail Detection]
During the first few seconds, if the greeting is clearly automated or there is only a beep, call detected_answering_machine.

[Compliance]
If the customer says do not call, remove me, or stop calling, confirm politely and call mark_dnc.
"""

DEFAULT_AGENT_CONFIGS = {
    "appointment_setter": {
        "model": "gemini-2.5-flash-native-audio-preview-12-2025",
        "voice": "Aoede",
        "agent_name": "Mia",
        "first_line": "Hi, this is Mia with Raj's Insurance. I’m just calling to help you schedule your follow-up.",
        "prompt": APPOINTMENT_SETTER_PROMPT,
    },
    "renewal_reminder": {
        "model": "gemini-2.5-flash-native-audio-preview-12-2025",
        "voice": "Aoede",
        "agent_name": "Ava",
        "first_line": "Hi, this is Ava with Raj's Insurance. I’m calling to review your current draft and see if you need anything adjusted.",
        "prompt": RENEWAL_REMINDER_PROMPT,
    },
}


def load_agent_configuration(agency_id: str, campaign_type: str) -> dict[str, Any]:
    fallback = DEFAULT_AGENT_CONFIGS.get(campaign_type, DEFAULT_AGENT_CONFIGS["appointment_setter"]).copy()

    try:
        response = (
            supabase.table("agent_configurations")
            .select("model, voice, agent_name, first_line, prompt")
            .eq("agency_id", agency_id)
            .eq("campaign_type", campaign_type)
            .limit(1)
            .execute()
        )
        data = response.data[0] if response.data else None
        if not data:
            return fallback

        return {
            "model": data.get("model") or fallback["model"],
            "voice": data.get("voice") or fallback["voice"],
            "agent_name": data.get("agent_name") or fallback["agent_name"],
            "first_line": data.get("first_line") or fallback["first_line"],
            "prompt": data.get("prompt") or fallback["prompt"],
        }
    except Exception:
        logger.exception("Unable to load agent configuration; using defaults.")
        return fallback


class InsuranceAgent(Agent):
    def __init__(self, lead: dict[str, Any], call_id: str, campaign_type: str, agent_config: dict[str, Any]):
        self.lead = lead
        self.call_id = call_id
        self.transcript_items: list[dict[str, str]] = []

        prompt = agent_config.get("prompt") or (
            RENEWAL_REMINDER_PROMPT if campaign_type == "renewal_reminder" else APPOINTMENT_SETTER_PROMPT
        )
        first_line = agent_config.get("first_line")

        if first_line:
            prompt = (
                f"{prompt}\n\n"
                "[Opening Line]\n"
                f'Start the live call with this line unless voicemail is detected: "{first_line}"'
            )

        super().__init__(instructions=prompt)

    def _append_note(self, role: str, content: str) -> None:
        self.transcript_items.append(
            {
                "role": role,
                "content": content,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        )

    @function_tool()
    async def mark_dnc(self, context: RunContext) -> str:
        self._append_note("tool", "Lead requested DNC")
        supabase.table("leads").update(
            {
                "status": "dnc",
                "last_contacted_at": datetime.now(UTC).isoformat(),
            }
        ).eq("id", self.lead["id"]).execute()
        return "The lead was marked as do-not-call."

    @function_tool()
    async def save_appointment(
        self,
        context: RunContext,
        scheduled_for_iso: str,
        phone: str | None = None,
        age: int | None = None,
        city: str | None = None,
        state: str | None = None,
        zip_code: str | None = None,
    ) -> str:
        self._append_note("tool", f"Appointment booked for {scheduled_for_iso}")

        updates = {
            "status": "appointment_booked",
            "last_contacted_at": datetime.now(UTC).isoformat(),
        }
        if phone:
            updates["phone"] = phone
        if age is not None:
            updates["age"] = age
        if city:
            updates["city"] = city
        if state:
            updates["state"] = state
        if zip_code:
            updates["zip"] = zip_code

        supabase.table("leads").update(updates).eq("id", self.lead["id"]).execute()
        supabase.table("appointments").insert(
            {
                "lead_id": self.lead["id"],
                "call_id": self.call_id,
                "agency_id": self.lead["agency_id"],
                "scheduled_for": scheduled_for_iso,
            }
        ).execute()

        return "Appointment saved."

    @function_tool()
    async def save_renewal_outcome(
        self,
        context: RunContext,
        comfort_with_premium: bool,
        comfort_monthly: bool,
        wants_more_coverage: bool,
        outcome: str,
    ) -> str:
        self._append_note("tool", f"Renewal outcome: {outcome}")
        supabase.table("call_analysis").upsert(
            {
                "call_id": self.call_id,
                "lead_id": self.lead["id"],
                "comfort_with_premium": comfort_with_premium,
                "comfort_monthly": comfort_monthly,
                "wants_more_coverage": wants_more_coverage,
                "outcome": outcome,
                "recommended_action": "close" if not wants_more_coverage else "agent_callback",
            },
            on_conflict="call_id",
        ).execute()
        return "Renewal outcome saved."

    @function_tool()
    async def warm_transfer(self, context: RunContext, transfer_number: str | None = None) -> str:
        number = transfer_number or self.lead.get("transfer_number")
        self._append_note("tool", f"Warm transfer requested to {number}")
        supabase.table("leads").update(
            {
                "status": "transferred",
                "last_contacted_at": datetime.now(UTC).isoformat(),
            }
        ).eq("id", self.lead["id"]).execute()
        return "Transfer requested. Announce the handoff naturally before ending."

    @function_tool()
    async def detected_answering_machine(self, context: RunContext) -> str:
        self._append_note("tool", "Voicemail detected")
        supabase.table("calls").update(
            {
                "status": "voicemail",
                "ended_at": datetime.now(UTC).isoformat(),
            }
        ).eq("id", self.call_id).execute()
        supabase.table("leads").update(
            {
                "status": "called",
                "last_contacted_at": datetime.now(UTC).isoformat(),
                "next_followup_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            }
        ).eq("id", self.lead["id"]).execute()
        return (
            "Hi, this is Mia with Raj's Insurance. I'm calling about your life insurance inquiry. "
            "Please call us back when you have a moment. Thank you."
        )


async def finalize_call(call_id: str, lead_id: str, agent: InsuranceAgent) -> None:
    transcript = "\n".join(
        f"{item['role'].upper()}: {item['content']}" for item in agent.transcript_items
    )

    current_call = supabase.table("calls").select("status").eq("id", call_id).single().execute()
    current_status = (current_call.data or {}).get("status")

    updates = {
        "transcript": transcript,
        "ended_at": datetime.now(UTC).isoformat(),
    }
    if current_status in {"initiated", "ringing", "in_progress"}:
        updates["status"] = "completed"

    supabase.table("calls").update(updates).eq("id", call_id).execute()

    # Transcript event capture differs across SDK releases. This scaffold stores tool-driven notes now
    # and leaves room to append full conversation items once the exact SDK hooks are pinned.
    logger.info("Call %s finalized for lead %s", call_id, lead_id)


async def entrypoint(ctx: JobContext) -> None:
    metadata = json.loads(ctx.job.metadata or "{}")
    call_id = metadata.get("callId")
    lead_id = metadata.get("leadId")

    if not call_id or not lead_id:
        logger.error("Missing callId/leadId in job metadata")
        return

    lead_response = supabase.table("leads").select("*").eq("id", lead_id).single().execute()
    lead = lead_response.data

    if not lead:
        logger.error("Lead %s not found", lead_id)
        return

    await ctx.connect()

    supabase.table("calls").update(
        {
            "status": "in_progress",
            "started_at": datetime.now(UTC).isoformat(),
        }
    ).eq("id", call_id).execute()

    agent_config = load_agent_configuration(
        agency_id=lead["agency_id"],
        campaign_type=lead.get("campaign_type", "appointment_setter"),
    )

    agent = InsuranceAgent(
        lead=lead,
        call_id=call_id,
        campaign_type=lead.get("campaign_type", "appointment_setter"),
        agent_config=agent_config,
    )

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model=agent_config.get("model", "gemini-2.5-flash-native-audio-preview-12-2025"),
            voice=agent_config.get("voice", "Aoede"),
            temperature=0.8,
        )
    )

    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(noise_cancellation=True),
    )

    opening_line = agent_config.get("first_line")
    opening_instructions = (
        f'Start the outbound call now. Say exactly this opening line first: "{opening_line}"'
        if opening_line
        else "Start the outbound call now with a natural greeting."
    )
    await session.generate_reply(
        instructions=opening_instructions,
        allow_interruptions=True,
    )

    await ctx.wait_for_disconnect()
    await finalize_call(call_id, lead_id, agent)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="insurance-agent",
        )
    )
