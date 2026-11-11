"""FastAPI backend service for Agentic AI Travel Planner."""

from __future__ import annotations

import os
import sys
from typing import Any

# Ensure backend directory is always in sys.path for root or package execution
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import TravelAgent
from log import log_step
from tools import TravelTools

load_dotenv()

app = FastAPI(title="AI Travel Planner API", version="2.0.0")

# Enable CORS for local Vite development and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported Indian cities
INDIAN_CITIES = {
    "Agra": "Agra",
    "Ahmedabad": "Ahmedabad",
    "Amritsar": "Amritsar",
    "Bengaluru": "Bengaluru",
    "Bhopal": "Bhopal",
    "Bhubaneswar": "Bhubaneswar",
    "Chandigarh": "Chandigarh",
    "Chennai": "Chennai",
    "Coimbatore": "Coimbatore",
    "Dehradun": "Dehradun",
    "Delhi": "Delhi",
    "Goa": "Goa",
    "Guwahati": "Guwahati",
    "Hyderabad": "Hyderabad",
    "Indore": "Indore",
    "Jaipur": "Jaipur",
    "Jammu": "Jammu",
    "Kochi": "Kochi",
    "Kolkata": "Kolkata",
    "Lucknow": "Lucknow",
    "Madurai": "Madurai",
    "Mangaluru": "Mangaluru",
    "Mumbai": "Mumbai",
    "Mysuru": "Mysuru",
    "Nagpur": "Nagpur",
    "Patna": "Patna",
    "Pune": "Pune",
    "Raipur": "Raipur",
    "Ranchi": "Ranchi",
    "Srinagar": "Srinagar",
    "Surat": "Surat",
    "Thiruvananthapuram": "Thiruvananthapuram",
    "Tiruchirappalli": "Tiruchirappalli",
    "Udaipur": "Udaipur",
    "Vadodara": "Vadodara",
    "Varanasi": "Varanasi",
    "Visakhapatnam": "Visakhapatnam",
}

# Cities with multiple active commercial passenger airports
MULTI_AIRPORT_CITIES: dict[str, list[dict[str, str]]] = {
    "Goa": [
        {"code": "GOI", "name": "Dabolim Airport (GOI - South Goa)"},
        {"code": "GOX", "name": "Manohar Intl Mopa (GOX - North Goa)"},
    ],
    "Delhi": [
        {"code": "DEL", "name": "Indira Gandhi Intl (DEL - Terminal 1/2/3)"},
        {"code": "HDO", "name": "Hindon Airport, Ghaziabad (HDO)"},
    ],
    "Mumbai": [
        {"code": "BOM", "name": "Chhatrapati Shivaji Maharaj Intl (BOM)"},
        {"code": "NMI", "name": "Navi Mumbai Intl (NMI)"},
    ],
}

# Initialize shared TravelAgent instance
tools = TravelTools()
travel_agent = TravelAgent(tools=tools)


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict[str, Any]] = []


class PlanRequest(BaseModel):
    origin: str
    destination: str
    origin_airport: str | None = None
    destination_airport: str | None = None
    hotel_preference: str = "tourist_attraction"  # "tourist_attraction" or "near_airport"
    trip_type: str = "round_trip"  # "round_trip" or "one_way"
    flights_only: bool = False  # True for One-Way 7-Day Flexible Flight Fare Comparison
    travellers: int = 2
    departure_date: str
    return_date: str | None = None
    budget: str | None = None
    conversation_history: list[dict[str, Any]] = []


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "provider": travel_agent.provider,
        "model": travel_agent.model_id,
    }


@app.get("/api/cities")
def get_cities():
    return {
        "cities": [
            {"label": label, "value": val}
            for label, val in sorted(INDIAN_CITIES.items(), key=lambda x: x[0])
        ],
        "multi_airports": MULTI_AIRPORT_CITIES,
    }


@app.post("/api/chat")
def handle_chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    try:
        reply = travel_agent.chat(req.message, req.conversation_history)
        return {"reply": reply, "status": "success"}
    except Exception as e:
        log_step("api_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plan")
def handle_plan(req: PlanRequest):
    if not req.origin or not req.destination:
        raise HTTPException(status_code=400, detail="Origin and destination are required.")
    if req.origin == req.destination:
        raise HTTPException(status_code=400, detail="Origin and destination must be different.")

    orig_display = f"{req.origin} ({req.origin_airport})" if req.origin_airport else req.origin
    dest_display = f"{req.destination} ({req.destination_airport})" if req.destination_airport else req.destination

    hotel_pref_inst = (
        "HOTEL PREFERENCE: The user explicitly requested hotels NEAR THE AIRPORT / transit hub. "
        "Recommend hotels located close to the airport with location_preference='near_airport'."
        if req.hotel_preference == "near_airport"
        else "HOTEL PREFERENCE: Recommend hotels near central tourist sights, heritage attractions, and popular city areas with location_preference='tourist_attraction'."
    )

    budget_part = f" under ₹{req.budget.strip()}" if req.budget and req.budget.strip() else ""

    if req.trip_type == "round_trip":
        if not req.return_date:
            raise HTTPException(status_code=400, detail="Return date is required for round trips.")
        form_prompt = (
            f"Plan a two-way (round trip) from {orig_display} to {dest_display} "
            f"for {int(req.travellers)} people, departing {req.departure_date} "
            f"and returning {req.return_date}{budget_part}. "
            f"{hotel_pref_inst} "
            "Search trip_type=round_trip. Include outbound AND return flight "
            "times on the travel end date, hotel options meeting the location preference, "
            "a destination snapshot, attractions, restaurants, a day-by-day itinerary through "
            "the return date, and a budget breakdown. Stay within the budget "
            "if the searched prices allow; if not, say so clearly."
        )
    elif req.flights_only:
        form_prompt = (
            f"FLIGHTS ONLY (7-Day Fare Calendar): Find one-way flights from {orig_display} to {dest_display} "
            f"for {int(req.travellers)} people across a 7-day window starting on {req.departure_date}{budget_part}. "
            "Do NOT search or recommend hotels, tourist attractions, restaurants, or a sightseeing itinerary. "
            "Call ONLY search_weekly_flights to retrieve daily flight options and fares for all 7 days. "
            "Present a clean 7-day comparison table showing the cheapest day to fly, airline options, "
            "flight numbers, departure and arrival times, durations, and prices. If a budget was provided, state which flights fit within it."
        )
    else:
        form_prompt = (
            f"Plan a one-way trip from {orig_display} to {dest_display} "
            f"for {int(req.travellers)} people, departing {req.departure_date}"
            f"{budget_part}. "
            f"{hotel_pref_inst} "
            "Search trip_type=one_way. Do not invent a return flight. "
            "Include destination snapshot, attractions, outbound flights, "
            "hotel options meeting the location preference, restaurants, itinerary, and budget."
        )

    try:
        reply = travel_agent.chat(form_prompt, req.conversation_history)
        return {
            "prompt": form_prompt,
            "reply": reply,
            "status": "success",
        }
    except Exception as e:
        log_step("api_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# Mount React production build if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

