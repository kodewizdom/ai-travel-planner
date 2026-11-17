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


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    origin_airport: str | None = None
    destination_airport: str | None = None
    departure_date: str
    return_date: str | None = None
    travellers: int = 1
    trip_type: str = "one_way"


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


@app.post("/api/flights")
def get_flights(req: FlightSearchRequest):
    try:
        orig = req.origin_airport or req.origin
        dest = req.destination_airport or req.destination
        flight_result = tools.search_flights(
            origin=orig,
            destination=dest,
            departure_date=req.departure_date,
            return_date=req.return_date if req.trip_type == "round_trip" else None,
            adults=req.travellers,
            currency="INR",
            trip_type=req.trip_type,
        )
        options = flight_result.get("options") or flight_result.get("outbound") or []
        flights = []
        for opt in options:
            flights.append({
                "airline": opt.get("airline", "Domestic Carrier"),
                "flightNo": opt.get("flightNo") or opt.get("flight_number", ""),
                "departureTime": opt.get("departureTime") or opt.get("departure", "07:00"),
                "arrivalTime": opt.get("arrivalTime") or opt.get("arrival", "09:15"),
                "duration": opt.get("duration", "2h 15m"),
                "stops": opt.get("stops", "Non-stop"),
                "price": int(opt.get("price", 5490)),
                "aircraft": opt.get("aircraft", "Airbus A320neo"),
                "baggage": opt.get("baggage", "7kg Cabin · 15kg Check-in"),
                "isLive": flight_result.get("live_pricing", False) or "Live" in str(flight_result.get("data_source", "")),
                "dataSource": flight_result.get("data_source", "Google Flights"),
            })
        return {
            "status": "success",
            "flights": flights,
            "data_source": flight_result.get("data_source", "Google Flights"),
            "booking_link": flight_result.get("booking_link"),
        }
    except Exception as e:
        log_step("flights_api_error", str(e))
        return {
            "status": "fallback",
            "flights": [],
            "error": str(e),
        }


class HotelSearchRequest(BaseModel):
    destination: str
    check_in_date: str | None = None
    check_out_date: str | None = None
    adults: int = 1
    rooms: int = 1


@app.post("/api/hotels")
def get_hotels(req: HotelSearchRequest):
    try:
        from datetime import datetime, timedelta
        check_in = req.check_in_date or datetime.today().strftime("%Y-%m-%d")
        check_out = req.check_out_date or (datetime.today() + timedelta(days=2)).strftime("%Y-%m-%d")
        result = tools.search_hotels(
            destination=req.destination,
            check_in_date=check_in,
            check_out_date=check_out,
            adults=req.adults,
            rooms=req.rooms,
        )
        return {
            "status": "success",
            "destination": req.destination,
            "hotels": result.get("hotels", []),
            "data_source": result.get("data_source", "Google Hotels & Verified Properties"),
        }
    except Exception as e:
        log_step("hotels_api_error", str(e))
        return {
            "status": "fallback",
            "hotels": [],
            "error": str(e),
        }


class RestaurantSearchRequest(BaseModel):
    destination: str
    limit: int = 12


@app.post("/api/restaurants")
def get_restaurants(req: RestaurantSearchRequest):
    try:
        result = tools.search_restaurants(destination=req.destination, limit=req.limit)
        return {
            "status": "success",
            "destination": req.destination,
            "restaurants": result.get("restaurants", []),
            "total": result.get("total", 0),
        }
    except Exception as e:
        log_step("restaurants_api_error", str(e))
        return {
            "status": "fallback",
            "restaurants": [],
            "error": str(e),
        }


class AttractionSearchRequest(BaseModel):
    destination: str
    limit: int = 10


@app.post("/api/attractions")
def get_attractions(req: AttractionSearchRequest):
    try:
        result = tools.search_attractions(destination=req.destination, limit=req.limit)
        return {
            "status": "success",
            "destination": req.destination,
            "attractions": result.get("attractions", []),
            "summary": result.get("summary", ""),
            "total": result.get("total", 0),
        }
    except Exception as e:
        log_step("attractions_api_error", str(e))
        return {
            "status": "fallback",
            "attractions": [],
            "error": str(e),
        }


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

    # Concurrently search live flights & hotels for the right-hand panel
    live_flights = []
    live_hotels = []
    live_restaurants = []
    live_attractions = []
    flight_data_source = "Google Flights"
    try:
        orig = req.origin_airport or req.origin
        dest = req.destination_airport or req.destination
        flight_result = tools.search_flights(
            origin=orig,
            destination=dest,
            departure_date=req.departure_date,
            return_date=req.return_date if req.trip_type == "round_trip" else None,
            adults=req.travellers,
            currency="INR",
            trip_type=req.trip_type,
        )
        flight_data_source = flight_result.get("data_source", "Google Flights")
        options = flight_result.get("options") or flight_result.get("outbound") or []
        for opt in options:
            live_flights.append({
                "airline": opt.get("airline", "Domestic Carrier"),
                "flightNo": opt.get("flightNo") or opt.get("flight_number", ""),
                "departureTime": opt.get("departureTime") or opt.get("departure", "07:00"),
                "arrivalTime": opt.get("arrivalTime") or opt.get("arrival", "09:15"),
                "duration": opt.get("duration", "2h 15m"),
                "stops": opt.get("stops", "Non-stop"),
                "price": int(opt.get("price", 5490)),
                "aircraft": opt.get("aircraft", "Airbus A320neo"),
                "baggage": opt.get("baggage", "7kg Cabin · 15kg Check-in"),
                "isLive": flight_result.get("live_pricing", False) or "Live" in str(flight_result.get("data_source", "")),
                "dataSource": flight_data_source,
            })
    except Exception as fl_err:
        log_step("plan_flights_lookup_err", str(fl_err))

    try:
        hotel_res = tools.search_hotels(
            destination=req.destination,
            check_in_date=req.departure_date,
            check_out_date=req.return_date or req.departure_date,
            adults=req.travellers,
            rooms=1,
            location_preference=req.hotel_preference,
        )
        live_hotels = hotel_res.get("hotels") or []
    except Exception as h_err:
        log_step("plan_hotels_lookup_err", str(h_err))

    try:
        r_res = tools.search_restaurants(destination=req.destination, limit=12)
        live_restaurants = r_res.get("restaurants") or []
    except Exception as r_err:
        log_step("plan_restaurants_lookup_err", str(r_err))

    try:
        a_res = tools.search_attractions(destination=req.destination, limit=10)
        live_attractions = a_res.get("attractions") or []
    except Exception as a_err:
        log_step("plan_attractions_lookup_err", str(a_err))

    try:
        reply = travel_agent.chat(form_prompt, req.conversation_history)
        return {
            "prompt": form_prompt,
            "reply": reply,
            "flights": live_flights,
            "hotels": live_hotels,
            "restaurants": live_restaurants,
            "attractions": live_attractions,
            "data_source": flight_data_source,
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

