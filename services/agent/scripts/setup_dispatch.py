import asyncio
import os

from livekit import api


async def main() -> None:
    client = api.LiveKitAPI(
        url=os.environ["LIVEKIT_URL"],
        api_key=os.environ["LIVEKIT_API_KEY"],
        api_secret=os.environ["LIVEKIT_API_SECRET"],
    )

    try:
        request = api.CreateSIPDispatchRuleRequest(
            rule=api.SIPDispatchRule(
                dispatch_rule_individual=api.SIPDispatchRuleIndividual(
                    room_prefix="call-",
                )
            ),
            name="Insurance Agent Dispatch",
            room_config=api.RoomConfiguration(
                agents=[
                    api.RoomAgentDispatch(
                        agent_name="insurance-agent",
                    )
                ]
            ),
        )
        dispatch = await client.sip.create_sip_dispatch_rule(request)
        print(f"SIP dispatch rule created: {dispatch.sip_dispatch_rule_id}")
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
