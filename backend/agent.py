"""Travel agent: Invocation and tool-use loop powered by Groq."""

from __future__ import annotations

import json
import os
import time
from typing import Any

import requests
from dotenv import load_dotenv

from log import log_step
from prompt import SYSTEM_PROMPT
from tools import TravelTools

load_dotenv()


class TravelAgent:
    """Handles travel planning conversations and tool calls via Groq."""

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(
        self,
        tools: TravelTools | None = None,
        model_id: str | None = None,
        max_tool_rounds: int = 6,
    ):
        self.tools = tools or TravelTools()
        self.max_tool_rounds = max_tool_rounds
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model_id = model_id or os.getenv("GROQ_MODEL_ID", "openai/gpt-oss-120b")
        self.provider = "groq" if self.api_key else "unconfigured"

        if self.api_key:
            log_step("agent_ready", f"model={self.model_id}")
        else:
            log_step("agent_warning", "GROQ_API_KEY not found in environment.")

    def _get_tools_spec(self) -> list[dict[str, Any]]:
        """Return function calling specifications for Groq."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "search_flights",
                    "description": (
                        "Search flights between Indian cities for a specific date. Use trip_type='round_trip' with return_date "
                        "for two-way travel. Dates format: YYYY-MM-DD."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "origin": {"type": "string"},
                            "destination": {"type": "string"},
                            "departure_date": {"type": "string"},
                            "return_date": {"type": "string"},
                            "trip_type": {"type": "string", "enum": ["round_trip", "one_way"]},
                            "adults": {"type": "integer", "minimum": 1},
                            "currency": {"type": "string"},
                        },
                        "required": ["origin", "destination", "departure_date", "adults"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_weekly_flights",
                    "description": (
                        "Search one-way flights and compare daily fares across a 7-day window starting from start_date. "
                        "Ideal when the user wants flexible dates, is travelling home, or asked for Flights Only (7-Day)."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "origin": {"type": "string"},
                            "destination": {"type": "string"},
                            "start_date": {"type": "string", "description": "Start date in YYYY-MM-DD format"},
                            "adults": {"type": "integer", "minimum": 1},
                            "days": {"type": "integer", "minimum": 1, "maximum": 7},
                            "currency": {"type": "string"},
                        },
                        "required": ["origin", "destination", "start_date", "adults"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_hotels",
                    "description": "Search hotels with nightly and total rates for the stay dates. Supports near-airport or near-tourist attractions preference.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "destination": {"type": "string"},
                            "check_in_date": {"type": "string"},
                            "check_out_date": {"type": "string"},
                            "adults": {"type": "integer", "minimum": 1},
                            "rooms": {"type": "integer", "minimum": 1},
                            "currency": {"type": "string"},
                            "location_preference": {
                                "type": "string",
                                "enum": ["tourist_attraction", "near_airport"],
                                "description": "Set to 'near_airport' if user prefers airport/transit hotels, or 'tourist_attraction' for city center and attractions.",
                            },
                        },
                        "required": ["destination", "check_in_date", "check_out_date", "adults"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_restaurants",
                    "description": "Find top restaurants and popular dining spots around the destination.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "destination": {"type": "string"},
                            "limit": {"type": "integer"},
                        },
                        "required": ["destination"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_attractions",
                    "description": "Get destination overview, sights, viewpoints, and attractions to visit.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "destination": {"type": "string"},
                            "limit": {"type": "integer"},
                        },
                        "required": ["destination"],
                    },
                },
            },
        ]

    def chat(
        self,
        user_message: str,
        conversation_history: list[dict[str, Any]] | None = None,
    ) -> str:
        """Send a message, execute requested tools, and return the final plan."""
        if not self.api_key:
            return (
                "### ⚠️ Groq API Key Missing\n\n"
                "Please add your free Groq API key to `.env`:\n"
                "```env\n"
                "GROQ_API_KEY=gsk_your_key_here\n"
                "```"
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        tools = self._get_tools_spec()

        messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        for item in (conversation_history or []):
            role = item.get("role", "user")
            content = item.get("content", "")
            if content:
                messages.append({"role": "user" if role == "user" else "assistant", "content": content})

        messages.append({"role": "user", "content": user_message})

        log_step("chat_start", user_message[:120])
        try:
            for round_idx in range(self.max_tool_rounds):
                log_step("groq_call", f"round={round_idx + 1}")
                payload = {
                    "model": self.model_id,
                    "messages": messages,
                    "tools": tools,
                    "temperature": 0.2,
                }

                resp = None
                for attempt in range(4):
                    resp = requests.post(self.GROQ_API_URL, headers=headers, json=payload, timeout=45)
                    if resp.status_code == 429:
                        wait_sec = 5 + (attempt * 3)
                        try:
                            msg_str = resp.json().get("error", {}).get("message", "")
                            if "Please try again in" in msg_str:
                                sec_part = msg_str.split("Please try again in")[1].split("s")[0].strip()
                                wait_sec = max(2, min(int(float(sec_part)) + 1, 15))
                        except Exception:
                            pass
                        log_step("groq_retry", f"Rate limit pause: waiting {wait_sec}s...")
                        time.sleep(wait_sec)
                        continue
                    break

                if not resp or not resp.ok:
                    err_text = resp.text if resp else "No response"
                    log_step("groq_error", err_text)
                    return f"Groq API error ({resp.status_code if resp else 'none'}): {err_text}"

                choice = resp.json()["choices"][0]
                assistant_msg = choice["message"]
                messages.append(assistant_msg)

                tool_calls = assistant_msg.get("tool_calls")
                if not tool_calls:
                    return assistant_msg.get("content") or "No response generated."

                for tool_call in tool_calls:
                    fn_name = tool_call["function"]["name"]
                    args_raw = tool_call["function"].get("arguments", "{}")
                    try:
                        args = json.loads(args_raw)
                    except Exception:
                        args = {}

                    log_step("tool_call", fn_name)
                    try:
                        tool_output = self.tools.run_tool(fn_name, args)
                        log_step("tool_ok", fn_name)
                    except Exception as err:
                        tool_output = {"error": str(err)}
                        log_step("tool_error", f"{fn_name}: {err}")

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "name": fn_name,
                        "content": json.dumps(tool_output),
                    })

            return "Reached maximum tool execution rounds."
        except Exception as error:
            log_step("chat_error", str(error))
            return f"Something went wrong while planning the trip: {error}"

    @staticmethod
    def to_bedrock_history(chat_messages: list[dict[str, str]]) -> list[dict[str, Any]]:
        """Convert chat history into message format."""
        history: list[dict[str, Any]] = []
        for item in chat_messages:
            role = item.get("role")
            content = item.get("content", "")
            if role in ("user", "assistant") and content:
                history.append({"role": role, "content": content})
        return history

