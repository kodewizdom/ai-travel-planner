"""Travel search tools: Live Google Flights (fli) + SerpApi backup, Hotels, Attractions, and Restaurants."""

from __future__ import annotations

import json
import math
import os
import re
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Any

import airportsdata
import requests

from log import log_step

try:
    from fli.models import Airport, FlightSearchFilters, FlightSegment, PassengerInfo, TripType
    from fli.search import SearchFlights
    HAS_FLI = True
except Exception:
    HAS_FLI = False
try:
    from curl_cffi import requests as curl_requests
    from fli.models import Airport, FlightSearchFilters, FlightSegment, PassengerInfo, TripType
    from fli.search import SearchFlights
    from fli.search._decoders import parse_flight_row
    HAS_FLI = True
except Exception:
    HAS_FLI = False


INDIAN_CITY_AIRPORTS: dict[str, str] = {
    "agra": "AGR",
    "ahmedabad": "AMD",
    "amritsar": "ATQ",
    "bengaluru": "BLR",
    "bangalore": "BLR",
    "bhopal": "BHO",
    "bhubaneswar": "BBI",
    "chandigarh": "IXC",
    "chennai": "MAA",
    "coimbatore": "CJB",
    "dehradun": "DED",
    "delhi": "DEL",
    "new delhi": "DEL",
    "goa": "GOI",
    "guwahati": "GAU",
    "hyderabad": "HYD",
    "indore": "IDR",
    "jaipur": "JAI",
    "jammu": "IXJ",
    "kochi": "COK",
    "cochin": "COK",
    "kolkata": "CCU",
    "calcutta": "CCU",
    "lucknow": "LKO",
    "madurai": "IXM",
    "mangaluru": "IXE",
    "mangalore": "IXE",
    "mumbai": "BOM",
    "bombay": "BOM",
    "mysuru": "MYQ",
    "mysore": "MYQ",
    "nagpur": "NAG",
    "patna": "PAT",
    "pune": "PNQ",
    "raipur": "RPR",
    "ranchi": "IXR",
    "srinagar": "SXR",
    "surat": "STV",
    "thiruvananthapuram": "TRV",
    "trivandrum": "TRV",
    "tiruchirappalli": "TRZ",
    "trichy": "TRZ",
    "udaipur": "UDR",
    "vadodara": "BDQ",
    "baroda": "BDQ",
    "varanasi": "VNS",
    "visakhapatnam": "VTZ",
    "vizag": "VTZ",
}


TOP_INDIAN_DESTINATIONS: dict[str, dict[str, Any]] = {
    "goa": {
        "summary": "Goa is India's premier beach state, famous for its coastline, Portuguese heritage, night markets, and seaside cafes.",
        "attractions": [
            {"name": "Calangute & Baga Beaches", "category": "Beach & Water Sports", "highlight": "Vibrant beach shacks, water sports, and sunsets."},
            {"name": "Basilica of Bom Jesus", "category": "Heritage", "highlight": "16th-century baroque church holding the remains of St. Francis Xavier."},
            {"name": "Aguada Fort & Lighthouse", "category": "Historic Fort", "highlight": "17th-century Portuguese fortress overlooking the Arabian Sea."},
            {"name": "Dudhsagar Waterfalls", "category": "Nature", "highlight": "Spectacular 4-tiered waterfall cascading down the Western Ghats."},
            {"name": "Palolem Beach", "category": "Scenic Beach", "highlight": "Calm crescent-shaped bay lined with palms."},
        ],
        "restaurants": [
            {"name": "Britto's", "cuisine": "Goan Seafood", "highlight": "Renowned for butter garlic crab and seafood platters."},
            {"name": "Fisherman's Wharf", "cuisine": "Goan Coastal", "highlight": "Riverside dining serving authentic fish curry and vindaloo."},
            {"name": "Gunpowder", "cuisine": "South Indian Coastal", "highlight": "Charming courtyard setting serving Kerala curries and appams."},
            {"name": "Vinayak Family Restaurant", "cuisine": "Fish Thali", "highlight": "Local favorite for authentic Goan fish curry thali."},
        ],
    },
    "jaipur": {
        "summary": "Jaipur, the Pink City of Rajasthan, is world-famous for its majestic palaces, historic hill forts, and rich culture.",
        "attractions": [
            {"name": "Amer Fort & Palace", "category": "Heritage Fort", "highlight": "Hilltop fort featuring the Sheesh Mahal (Mirror Palace)."},
            {"name": "Hawa Mahal (Palace of Winds)", "category": "Historic Landmark", "highlight": "Iconic five-story pink sandstone facade with 953 windows."},
            {"name": "City Palace & Museum", "category": "Royal Palace", "highlight": "Complex of courtyards, gardens, and royal Rajput architecture."},
            {"name": "Jantar Mantar", "category": "UNESCO Observatory", "highlight": "18th-century observatory with the world's largest stone sundial."},
            {"name": "Nahargarh Fort", "category": "Viewpoint", "highlight": "Panoramic sunset views overlooking the Jaipur skyline."},
        ],
        "restaurants": [
            {"name": "LMB (Laxmi Mishtan Bhandar)", "cuisine": "Rajasthani Thali", "highlight": "Heritage eatery famous for Dal Baati Churma and Ghewar."},
            {"name": "1135 AD", "cuisine": "Royal Rajasthani", "highlight": "Fine dining inside Amer Fort with royal silver service."},
            {"name": "Rawat Mishthan Bhandar", "cuisine": "Street Food", "highlight": "Famous across India for hot crisp Mawa and Pyaaz kachoris."},
            {"name": "Handi Restaurant", "cuisine": "North Indian", "highlight": "Celebrated for Handi meat, Laal Maas, and kebabs."},
        ],
    },
    "delhi": {
        "summary": "India's capital city, blending Mughal and colonial heritage monuments with bustling bazaars and modern cuisine.",
        "attractions": [
            {"name": "Red Fort (Lal Qila)", "category": "UNESCO Heritage", "highlight": "Mughal red sandstone fortress that was the imperial residence."},
            {"name": "Qutub Minar", "category": "UNESCO Heritage", "highlight": "World's tallest brick minaret standing 73 meters tall."},
            {"name": "Humayun's Tomb", "category": "UNESCO Heritage", "highlight": "16th-century Persian-style garden tomb that inspired the Taj Mahal."},
            {"name": "India Gate", "category": "War Memorial", "highlight": "Iconic 42-meter triumphal arch flanked by landscaped lawns."},
            {"name": "Lotus Temple", "category": "Architectural Landmark", "highlight": "Baháʼí House of Worship shaped like a blooming white lotus flower."},
        ],
        "restaurants": [
            {"name": "Karim's", "cuisine": "Mughlai Heritage", "highlight": "Historic restaurant near Jama Masjid famous for mutton burra."},
            {"name": "Bukhara (ITC Maurya)", "cuisine": "North-West Frontier", "highlight": "World-renowned culinary icon famous for Dal Bukhara."},
            {"name": "Gulati Restaurant", "cuisine": "North Indian", "highlight": "Late-night favorite celebrated for butter chicken and dal makhani."},
            {"name": "Saravana Bhavan", "cuisine": "South Indian Veg", "highlight": "Classic spot for crisp dosas and filter coffee in CP."},
        ],
    },
    "bengaluru": {
        "summary": "The Silicon Valley and Garden City of India, known for pleasant year-round weather, parks, and craft breweries.",
        "attractions": [
            {"name": "Lalbagh Botanical Garden", "category": "Botanical Park", "highlight": "240-acre garden with a historic Victorian glass house."},
            {"name": "Cubbon Park", "category": "Urban Park", "highlight": "Lush 300-acre green lung in the city center."},
            {"name": "Bangalore Palace", "category": "Royal Heritage", "highlight": "Tudor-style palace inspired by England's Windsor Castle."},
            {"name": "Vidhana Soudha", "category": "Landmark", "highlight": "Imposing Neo-Dravidian granite legislative assembly."},
        ],
        "restaurants": [
            {"name": "Vidyarthi Bhavan", "cuisine": "South Indian", "highlight": "Heritage eatery famous since 1943 for butter masala dosas."},
            {"name": "Toit Brewpub", "cuisine": "Craft Brewery", "highlight": "Famous for artisanal beers and wood-fired pizzas."},
            {"name": "Mavalli Tiffin Room (MTR)", "cuisine": "Karnataka Meals", "highlight": "Heritage institution, inventor of Rava Idli."},
            {"name": "Nagarjuna", "cuisine": "Andhra Meals", "highlight": "Famed for spicy banana-leaf meals and chicken roast."},
        ],
    },
}


NEAR_AIRPORT_HOTELS: dict[str, list[dict[str, Any]]] = {
    "goa": [
        {"name": "Bogmallo Beach Resort", "type": "Beachfront Transit Resort", "base": 3800, "rating": 4.3, "proximity": "5 mins from Dabolim (GOI) Airport"},
        {"name": "Coconut Creek Resort", "type": "Eco Boutique Resort", "base": 2900, "rating": 4.5, "proximity": "10 mins from Dabolim Airport"},
        {"name": "Mercure Devaaya Goa", "type": "Wellness Stay", "base": 4200, "rating": 4.4, "proximity": "Convenient access to Mopa (GOX) corridor"},
    ],
    "delhi": [
        {"name": "JW Marriott Hotel New Delhi Aerocity", "type": "Luxury Airport Hotel", "base": 6800, "rating": 4.7, "proximity": "Aerocity, 5 mins from IGI Terminal 3"},
        {"name": "Aloft New Delhi Aerocity", "type": "Modern Business Transit", "base": 4500, "rating": 4.5, "proximity": "Aerocity, direct Airport Express Metro"},
        {"name": "Ibis New Delhi Aerocity", "type": "Budget Comfort Transit", "base": 2600, "rating": 4.2, "proximity": "Aerocity, free airport shuttle"},
    ],
    "mumbai": [
        {"name": "The Orchid Hotel Mumbai Vile Parle", "type": "Ecotel Airport Hotel", "base": 4500, "rating": 4.4, "proximity": "Adjacent to Domestic Terminal T1"},
        {"name": "ITC Maratha Luxury Collection", "type": "5-Star Transit", "base": 6900, "rating": 4.7, "proximity": "5 mins from International Terminal T2"},
        {"name": "Niranta Airport Transit Hotel", "type": "Inside Terminal Stay", "base": 3200, "rating": 4.3, "proximity": "Inside T2 Terminal building"},
    ],
    "bengaluru": [
        {"name": "Taj Bangalore Airport", "type": "Luxury Terminal Hotel", "base": 7400, "rating": 4.8, "proximity": "Directly opposite Terminal 1 & 2"},
        {"name": "Goldfinch Retreat Kempegowda", "type": "Resort near Airport", "base": 3100, "rating": 4.3, "proximity": "10 mins from Kempegowda Airport"},
        {"name": "Signature Club Resort Devanahalli", "type": "Transit Club Stay", "base": 2400, "rating": 4.2, "proximity": "Near Airport highway"},
    ],
    "hyderabad": [
        {"name": "Novotel Hyderabad Airport Shamshabad", "type": "Premium Airport Hotel", "base": 5100, "rating": 4.5, "proximity": "Inside Rajiv Gandhi Airport complex"},
        {"name": "Hotel Transit Shamshabad", "type": "Budget Transit Stay", "base": 1800, "rating": 4.1, "proximity": "5 mins from HYD airport terminal"},
    ],
    "jaipur": [
        {"name": "Jaipur Marriott Hotel", "type": "Luxury Airport Hotel", "base": 5200, "rating": 4.6, "proximity": "Near Jaipur International Airport"},
        {"name": "The Lalit Jaipur", "type": "5-Star Transit", "base": 4600, "rating": 4.5, "proximity": "7 mins from Jaipur Airport"},
        {"name": "Hotel Airport View Jaipur", "type": "Budget Airport Stay", "base": 1600, "rating": 4.1, "proximity": "3 mins from terminal, view of runway"},
    ],
}


class TravelTools:
    """Provides travel search tools powered by live Google Flights (fli) with SerpApi backup."""

    PHOTON_URL = "https://photon.komoot.io/api/"
    WIKIPEDIA_REST_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/"
    SERPAPI_URL = "https://serpapi.com/search.json"
    CACHE_TTL_SEC = 3600  # 1-hour cache to minimize duplicate external requests

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.airports = airportsdata.load("IATA")
        self._flight_cache: dict[tuple[Any, ...], tuple[float, dict[str, Any]]] = {}

    def _get_cached(self, key: tuple[Any, ...]) -> dict[str, Any] | None:
        entry = self._flight_cache.get(key)
        if not entry:
            return None
        ts, val = entry
        if time.time() - ts <= self.CACHE_TTL_SEC:
            return val
        self._flight_cache.pop(key, None)
        return None

    def _set_cached(self, key: tuple[Any, ...], value: dict[str, Any]) -> None:
        self._flight_cache[key] = (time.time(), value)

    def resolve_airport_code(self, place: str) -> str:
        """Resolve an Indian city or airport name (or 'City (CODE)') to an IATA 3-letter code."""
        value = place.strip()
        paren_match = re.search(r"\(([A-Za-z]{3})\)", value)
        if paren_match:
            return paren_match.group(1).upper()

        needle = value.split(",")[0].strip().casefold()
        if needle in INDIAN_CITY_AIRPORTS:
            return INDIAN_CITY_AIRPORTS[needle]

        if len(value) == 3 and value.isalpha() and value.upper() in self.airports:
            return value.upper()

        in_matches: list[tuple[str, Any]] = []
        global_matches: list[tuple[str, Any]] = []
        for code, airport in self.airports.items():
            city = str(getattr(airport, "city", "") if not isinstance(airport, dict) else airport.get("city", "")).casefold()
            name = str(getattr(airport, "name", "") if not isinstance(airport, dict) else airport.get("name", "")).casefold()
            country = str(getattr(airport, "country", "") if not isinstance(airport, dict) else airport.get("country", "")).upper()
            if needle == city or needle == name or needle in city or needle in name:
                target = in_matches if country == "IN" else global_matches
                target.append((code, airport))

        matches = in_matches or global_matches
        if not matches:
            raise ValueError(f"Could not identify an airport for '{place}'. Please enter the 3-letter IATA code.")

        matches.sort(key=lambda x: (0 if "international" in str(getattr(x[1], "name", "") if not isinstance(x[1], dict) else x[1].get("name", "")).lower() else 1, x[0]))
        return matches[0][0]

    def _haversine_distance_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great-circle distance between two coordinates in km."""
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = math.sin(d_lat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
        return r * (2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)))

    def _geocode(self, destination: str) -> tuple[float, float, str]:
        """Geocode destination city to latitude, longitude, and formatted name."""
        try:
            r = requests.get(
                self.PHOTON_URL,
                params={"q": f"{destination}, India", "limit": "1"},
                headers={"User-Agent": "TravelPlanner/1.0"},
                timeout=self.timeout,
            )
            if r.ok:
                features = r.json().get("features", [])
                if features:
                    coords = features[0].get("geometry", {}).get("coordinates", [77.2, 28.6])
                    name = features[0].get("properties", {}).get("name") or destination
                    return float(coords[1]), float(coords[0]), f"{name}, India"
        except Exception as e:
            log_step("geocode_error", str(e))

        hubs = {
            "goa": (15.2993, 74.1240),
            "delhi": (28.6139, 77.2090),
            "mumbai": (19.0760, 72.8777),
            "jaipur": (26.9124, 75.7873),
            "bengaluru": (12.9716, 77.5946),
            "hyderabad": (17.3850, 78.4867),
        }
        clean = destination.lower().split()[0]
        if clean in hubs:
            lat, lon = hubs[clean]
            return lat, lon, f"{destination.title()}, India"

        return 20.5937, 78.9629, f"{destination.title()}, India"

    def _get_wiki_snapshot(self, destination: str) -> str:
        """Fetch concise destination overview from Wikipedia REST API."""
        clean = destination.split(",")[0].strip()
        try:
            url = f"{self.WIKIPEDIA_REST_URL}{urllib.parse.quote(clean)}"
            r = requests.get(url, headers={"User-Agent": "TravelPlanner/1.0"}, timeout=8)
            if r.ok:
                return r.json().get("extract", "")[:220]
        except Exception:
            pass
        return f"{clean.title()} is one of India's prominent travel destinations."

    def _google_flights_url(self, dep_code: str, arr_code: str, departure_date: str, return_date: str | None = None) -> str:
        """Generate direct Google Flights verification URL."""
        if return_date:
            q = f"Flights to {arr_code} from {dep_code} on {departure_date} through {return_date}"
        else:
            q = f"One way flights to {arr_code} from {dep_code} on {departure_date}"
        return f"https://www.google.com/travel/flights?q={urllib.parse.quote(q)}&curr=INR"

    def _compute_distance_estimate(self, dep_code: str, arr_code: str) -> tuple[int, int]:
        """Fallback duration (minutes) and approximate INR fare when live sources are unreachable."""
        dep_info: Any = self.airports.get(dep_code, {})
        arr_info: Any = self.airports.get(arr_code, {})
        lat1 = float(getattr(dep_info, "lat", 20.0) if not isinstance(dep_info, dict) else dep_info.get("lat", 20.0))
        lon1 = float(getattr(dep_info, "lon", 78.0) if not isinstance(dep_info, dict) else dep_info.get("lon", 78.0))
        lat2 = float(getattr(arr_info, "lat", 20.0) if not isinstance(arr_info, dict) else arr_info.get("lat", 20.0))
        lon2 = float(getattr(arr_info, "lon", 78.0) if not isinstance(arr_info, dict) else arr_info.get("lon", 78.0))
        dist_km = self._haversine_distance_km(lat1, lon1, lat2, lon2)
        duration_min = max(45, round((dist_km / 720.0) * 60.0 + 35.0))
        base_fare_pp = max(2800, round(2200 + (dist_km * 3.8) + 450))
        return duration_min, base_fare_pp

    def _fli_search_leg(
        self,
        dep_code: str,
        arr_code: str,
        travel_date: str,
        adults: int = 1,
        currency: str = "INR",
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Query live one-way flights via Google Flights (fli). Returns formatted flight list."""
        if not HAS_FLI:
            raise RuntimeError("flights (fli) library not available")
        dep_enum = getattr(Airport, dep_code, None)
        arr_enum = getattr(Airport, arr_code, None)
        if dep_enum is None or arr_enum is None:
            raise ValueError(f"Airport code unsupported by fli: {dep_code} -> {arr_code}")

        filters = FlightSearchFilters(
            passenger_info=PassengerInfo(adults=max(1, int(adults))),
            flight_segments=[
                FlightSegment(
                    departure_airport=[[dep_enum, 0]],
                    arrival_airport=[[arr_enum, 0]],
                    travel_date=travel_date,
                )
            ],
            trip_type=TripType.ONE_WAY,
        )
        raw_results = SearchFlights().search(filters, currency=currency, country="IN")
        valid = [r for r in (raw_results or []) if getattr(r, "price", None) and r.price > 0 and getattr(r, "legs", None)]
        valid.sort(key=lambda r: (r.price, r.stops))

        formatted: list[dict[str, Any]] = []
        for r in valid[:limit]:
            legs = r.legs
            airlines = ", ".join(dict.fromkeys(l.airline.value for l in legs))
            flight_nums = " / ".join(f"{l.airline.name.lstrip('_')}-{l.flight_number}" for l in legs)
            dep_str = legs[0].departure_datetime.strftime("%H:%M")
            arr_str = legs[-1].arrival_datetime.strftime("%H:%M")
            dur_str = f"{r.duration // 60}h {r.duration % 60}m"
            stops_label = "Non-stop" if r.stops == 0 else f"{r.stops} stop{'s' if r.stops > 1 else ''}"

            formatted.append({
                "airline": airlines,
                "flight_number": flight_nums,
                "departure": dep_str,
                "arrival": arr_str,
                "duration": dur_str,
                "stops": stops_label,
                "price": int(round(r.price)),
            })
        return formatted

    def _serpapi_search_leg(
        self,
        dep_code: str,
        arr_code: str,
        travel_date: str,
        adults: int = 1,
        currency: str = "INR",
        limit: int = 5,
    ) -> list[dict[str, Any]] | None:
        """Backup live Google Flights query using SerpApi when configured via SERPAPI_API_KEY."""
        api_key = os.getenv("SERPAPI_API_KEY", "").strip()
        if not api_key:
            return None

        params = {
            "engine": "google_flights",
            "departure_id": dep_code,
            "arrival_id": arr_code,
            "outbound_date": travel_date,
            "type": "2",  # one-way
            "adults": str(max(1, int(adults))),
            "currency": currency,
            "gl": "in",
            "hl": "en",
            "api_key": api_key,
        }
        r = requests.get(self.SERPAPI_URL, params=params, timeout=self.timeout)
        r.raise_for_status()
        data = r.json()
        raw_items = (data.get("best_flights") or []) + (data.get("other_flights") or [])
        formatted: list[dict[str, Any]] = []
        for item in raw_items:
            price = item.get("price")
            legs = item.get("flights") or []
            if not price or not legs:
                continue
            airlines = ", ".join(dict.fromkeys(str(l.get("airline", "")) for l in legs if l.get("airline")))
            flight_nums = " / ".join(str(l.get("flight_number", "")) for l in legs if l.get("flight_number"))
            dep_time = str(legs[0].get("departure_airport", {}).get("time", ""))[-5:]
            arr_time = str(legs[-1].get("arrival_airport", {}).get("time", ""))[-5:]
            dur_min = int(item.get("total_duration") or 0)
            stops = max(0, len(legs) - 1)
            formatted.append({
                "airline": airlines,
                "flight_number": flight_nums,
                "departure": dep_time,
                "arrival": arr_time,
                "duration": f"{dur_min // 60}h {dur_min % 60}m" if dur_min else "",
                "stops": "Non-stop" if stops == 0 else f"{stops} stop{'s' if stops > 1 else ''}",
                "price": int(round(float(price))),
            })
        formatted.sort(key=lambda x: x["price"])
        return formatted[:limit]

    def _fetch_leg_with_backup(
        self,
        dep_code: str,
        arr_code: str,
        travel_date: str,
        adults: int,
        currency: str,
        limit: int = 5,
    ) -> tuple[list[dict[str, Any]], str, bool]:
        """Try primary fli Google Flights, then SerpApi backup. Returns (flights, source_name, live_ok)."""
        try:
            options = self._fli_search_leg(dep_code, arr_code, travel_date, adults, currency, limit)
            if options:
                return options, "Google Flights (Live)", True
            # Confirm 0 flights if SerpApi backup is set; otherwise report 0 flights honestly
            backup = self._serpapi_search_leg(dep_code, arr_code, travel_date, adults, currency, limit)
            if backup is not None:
                return backup, "SerpApi Google Flights (Live)", True
            return [], "Google Flights (Live)", True
        except Exception as err:
            log_step("fli_fallback", f"{dep_code}->{arr_code} {travel_date}: {err}")
            try:
                backup = self._serpapi_search_leg(dep_code, arr_code, travel_date, adults, currency, limit)
                if backup is not None:
                    return backup, "SerpApi Google Flights (Live Backup)", True
            except Exception as b_err:
                log_step("serpapi_error", str(b_err))
            return [], "Unavailable", False

    def _format_fli_results(self, raw_results: list[Any], limit: int = 5) -> list[dict[str, Any]]:
        """Format raw fli FlightResult objects into compact sorted dictionaries."""
        valid = [r for r in (raw_results or []) if getattr(r, "price", None) and r.price > 0 and getattr(r, "legs", None)]
        valid.sort(key=lambda r: (r.price, r.stops))

        formatted: list[dict[str, Any]] = []
        for r in valid[:limit]:
            legs = r.legs
            airlines = ", ".join(dict.fromkeys(l.airline.value for l in legs))
            flight_nums = " / ".join(f"{l.airline.name.lstrip('_')}-{l.flight_number}" for l in legs)
            dep_str = legs[0].departure_datetime.strftime("%H:%M")
            arr_str = legs[-1].arrival_datetime.strftime("%H:%M")
            dur_str = f"{r.duration // 60}h {r.duration % 60}m"
            stops_label = "Non-stop" if r.stops == 0 else f"{r.stops} stop{'s' if r.stops > 1 else ''}"

            formatted.append({
                "airline": airlines,
                "flight_number": flight_nums,
                "departure": dep_str,
                "arrival": arr_str,
                "duration": dur_str,
                "stops": stops_label,
                "price": int(round(r.price)),
            })
        return formatted

    def _fli_html_search_leg(
        self,
        dep_code: str,
        arr_code: str,
        travel_date: str,
        adults: int = 1,
        currency: str = "INR",
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Query Google Flights search page HTML ds:1 block using curl_cffi and fli decoder."""
        pax_str = "1+adult" if int(adults) <= 1 else f"{int(adults)}+adults"
        q = f"One+way+flights+to+{arr_code}+from+{dep_code}+on+{travel_date}+{pax_str}"
        url = f"https://www.google.com/travel/flights?q={q}&curr={currency}&gl=IN"
        r = curl_requests.get(url, impersonate="chrome", timeout=self.timeout)
        r.raise_for_status()

        scripts = re.findall(r"AF_initDataCallback\(\{key:\s*'ds:1'.*?data:(.*?),\s*sideChannel:", r.text, re.S)
        if not scripts:
            return []

        data = json.loads(scripts[0])
        rows = [item for i in (2, 3) if len(data) > i and isinstance(data[i], list) and data[i] for item in data[i][0]]
        parsed = []
        for row in rows:
            try:
                parsed.append(parse_flight_row(row))
            except Exception:
                continue
        return self._format_fli_results(parsed, limit=limit)

    def _fli_search_leg(
        self,
        dep_code: str,
        arr_code: str,
        travel_date: str,
        adults: int = 1,
        currency: str = "INR",
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Query live one-way flights via fli RPC, automatically falling back to Google Flights HTML ds:1."""
        if not HAS_FLI:
            raise RuntimeError("flights (fli) library not available")
        dep_enum = getattr(Airport, dep_code, None)
        arr_enum = getattr(Airport, arr_code, None)
        if dep_enum is None or arr_enum is None:
            raise ValueError(f"Airport code unsupported by fli: {dep_code} -> {arr_code}")

        try:
            filters = FlightSearchFilters(
                passenger_info=PassengerInfo(adults=max(1, int(adults))),
                flight_segments=[
                    FlightSegment(
                        departure_airport=[[dep_enum, 0]],
                        arrival_airport=[[arr_enum, 0]],
                        travel_date=travel_date,
                    )
                ],
                trip_type=TripType.ONE_WAY,
            )
            raw_results = SearchFlights().search(filters, currency=currency, country="IN")
            formatted = self._format_fli_results(raw_results or [], limit=limit)
            if formatted:
                return formatted
        except Exception as rpc_err:
            log_step("fli_rpc_retry_html", str(rpc_err))

        return self._fli_html_search_leg(dep_code, arr_code, travel_date, adults, currency, limit)

    def _serpapi_search_leg(
        self,
        dep_code: str,
        arr_code: str,
        travel_date: str,
        adults: int = 1,
        currency: str = "INR",
        limit: int = 5,
    ) -> list[dict[str, Any]] | None:
        """Backup live Google Flights query using SerpApi when configured via SERPAPI_API_KEY."""
        api_key = os.getenv("SERPAPI_API_KEY", "").strip()
        if not api_key:
            return None

        params = {
            "engine": "google_flights",
            "departure_id": dep_code,
            "arrival_id": arr_code,
            "outbound_date": travel_date,
            "type": "2",  # one-way
            "adults": str(max(1, int(adults))),
            "currency": currency,
            "gl": "in",
            "hl": "en",
            "api_key": api_key,
        }
        r = requests.get(self.SERPAPI_URL, params=params, timeout=self.timeout)
        r.raise_for_status()
        data = r.json()
        raw_items = (data.get("best_flights") or []) + (data.get("other_flights") or [])
        formatted: list[dict[str, Any]] = []
        for item in raw_items:
            price = item.get("price")
            legs = item.get("flights") or []
            if not price or not legs:
                continue
            airlines = ", ".join(dict.fromkeys(str(l.get("airline", "")) for l in legs if l.get("airline")))
            flight_nums = " / ".join(str(l.get("flight_number", "")) for l in legs if l.get("flight_number"))
            dep_time = str(legs[0].get("departure_airport", {}).get("time", ""))[-5:]
            arr_time = str(legs[-1].get("arrival_airport", {}).get("time", ""))[-5:]
            dur_min = int(item.get("total_duration") or 0)
            stops = max(0, len(legs) - 1)
            formatted.append({
                "airline": airlines,
                "flight_number": flight_nums,
                "departure": dep_time,
                "arrival": arr_time,
                "duration": f"{dur_min // 60}h {dur_min % 60}m" if dur_min else "",
                "stops": "Non-stop" if stops == 0 else f"{stops} stop{'s' if stops > 1 else ''}",
                "price": int(round(float(price))),
            })
        formatted.sort(key=lambda x: x["price"])
        return formatted[:limit]

    def _fetch_leg_with_backup(
        self,
        dep_code: str,
        arr_code: str,
        travel_date: str,
        adults: int,
        currency: str,
        limit: int = 5,
    ) -> tuple[list[dict[str, Any]], str, bool]:
        """Try primary fli Google Flights, then SerpApi backup. Returns (flights, source_name, live_ok)."""
        try:
            options = self._fli_search_leg(dep_code, arr_code, travel_date, adults, currency, limit)
            if options:
                return options, "Google Flights (Live)", True
            # Confirm 0 flights if SerpApi backup is set; otherwise report 0 flights honestly
            backup = self._serpapi_search_leg(dep_code, arr_code, travel_date, adults, currency, limit)
            if backup is not None:
                return backup, "SerpApi Google Flights (Live)", True
            return [], "Google Flights (Live)", True
        except Exception as err:
            log_step("fli_fallback", f"{dep_code}->{arr_code} {travel_date}: {err}")
            try:
                backup = self._serpapi_search_leg(dep_code, arr_code, travel_date, adults, currency, limit)
                if backup is not None:
                    return backup, "SerpApi Google Flights (Live Backup)", True
            except Exception as b_err:
                log_step("serpapi_error", str(b_err))
            return [], "Unavailable", False

    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: str | None = None,
        adults: int = 1,
        currency: str = "INR",
        trip_type: str | None = None,
    ) -> dict[str, Any]:
        """Search live flights with fli primary, SerpApi backup, and honest fallback."""
        dep_code = self.resolve_airport_code(origin)
        arr_code = self.resolve_airport_code(destination)
        adults = max(1, int(adults))
        is_round_trip = (trip_type in ("round_trip", "roundtrip")) or bool(return_date)

        cache_key = ("single", dep_code, arr_code, departure_date, return_date if is_round_trip else None, adults, currency)
        cached = self._get_cached(cache_key)
        if cached:
            log_step("flight_cache_hit", f"{dep_code}->{arr_code}")
            return cached

        verify_url = self._google_flights_url(dep_code, arr_code, departure_date, return_date if is_round_trip else None)
        outbound, data_source, live_ok = self._fetch_leg_with_backup(dep_code, arr_code, departure_date, adults, currency, limit=5)

        if live_ok and not outbound:
            result = {
                "route": f"{dep_code} to {arr_code}",
                "status": "no_flights_found",
                "data_source": data_source,
                "trip_type": "round_trip" if is_round_trip else "one_way",
                "departure_date": departure_date,
                "return_date": return_date if is_round_trip else None,
                "travellers": adults,
                "currency": currency,
                "message": f"No scheduled commercial flights found on Google Flights for {dep_code} to {arr_code} on {departure_date}.",
                "booking_link": verify_url,
                "options": [],
            }
            self._set_cached(cache_key, result)
            return result

        if not live_ok:
            duration_min, base_fare_pp = self._compute_distance_estimate(dep_code, arr_code)
            est_price = base_fare_pp * adults
            est_opt: dict[str, Any] = {
                "airline": "Estimated Domestic Fare (Verify Live)",
                "flight_number": "Unverified",
                "departure": "Varies",
                "arrival": "Varies",
                "duration": f"~{duration_min // 60}h {duration_min % 60}m",
                "stops": "Non-stop / Connecting",
                "price": est_price,
            }
            if is_round_trip and return_date:
                est_opt["round_trip_price_total"] = est_price * 2
            return {
                "route": f"{dep_code} to {arr_code}",
                "status": "estimated_only",
                "data_source": "Offline Estimate (Live search temporarily unreachable)",
                "trip_type": "round_trip" if is_round_trip else "one_way",
                "departure_date": departure_date,
                "return_date": return_date if is_round_trip else None,
                "travellers": adults,
                "currency": currency,
                "booking_link": verify_url,
                "options": [est_opt],
            }

        if is_round_trip and return_date:
            ret_opts, _, ret_ok = self._fetch_leg_with_backup(arr_code, dep_code, return_date, adults, currency, limit=3)
            if ret_ok and ret_opts:
                best_ret = ret_opts[0]
                for opt in outbound:
                    opt["return_flight"] = {
                        "airline": best_ret["airline"],
                        "flight_number": best_ret["flight_number"],
                        "departure": best_ret["departure"],
                        "arrival": best_ret["arrival"],
                        "duration": best_ret["duration"],
                        "stops": best_ret["stops"],
                        "price": best_ret["price"],
                    }
                    opt["round_trip_price_total"] = opt["price"] + best_ret["price"]
                outbound[0]["return_options"] = ret_opts
            elif ret_ok and not ret_opts:
                result = {
                    "route": f"{dep_code} to {arr_code}",
                    "status": "no_return_flights_found",
                    "data_source": data_source,
                    "trip_type": "round_trip",
                    "departure_date": departure_date,
                    "return_date": return_date,
                    "travellers": adults,
                    "currency": currency,
                    "message": f"Outbound flights exist on {departure_date}, but no return flights were found for {arr_code} to {dep_code} on {return_date}.",
                    "booking_link": verify_url,
                    "options": outbound,
                }
                self._set_cached(cache_key, result)
                return result

        result = {
            "route": f"{dep_code} to {arr_code}",
            "status": "ok",
            "data_source": data_source,
            "trip_type": "round_trip" if is_round_trip else "one_way",
            "departure_date": departure_date,
            "return_date": return_date if is_round_trip else None,
            "travellers": adults,
            "currency": currency,
            "booking_link": verify_url,
            "options": outbound,
        }
        self._set_cached(cache_key, result)
        return result

    def search_weekly_flights(
        self,
        origin: str,
        destination: str,
        start_date: str,
        adults: int = 1,
        days: int = 7,
        currency: str = "INR",
    ) -> dict[str, Any]:
        """Search live one-way flights and fares across a 7-day window from start_date."""
        dep_code = self.resolve_airport_code(origin)
        arr_code = self.resolve_airport_code(destination)
        adults = max(1, int(adults))
        days = max(1, min(int(days), 7))
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        date_list = [(start_dt + timedelta(days=offset)).strftime("%Y-%m-%d") for offset in range(days)]

        cache_key = ("weekly", dep_code, arr_code, start_date, days, adults, currency)
        cached = self._get_cached(cache_key)
        if cached:
            log_step("weekly_cache_hit", f"{dep_code}->{arr_code}")
            return cached

        verify_url = self._google_flights_url(dep_code, arr_code, start_date)

        def fetch_day(d_str: str) -> tuple[str, list[dict[str, Any]], str, bool]:
            opts, src, ok = self._fetch_leg_with_backup(dep_code, arr_code, d_str, adults, currency, limit=3)
            return d_str, opts, src, ok

        with ThreadPoolExecutor(max_workers=3) as executor:
            day_results = list(executor.map(fetch_day, date_list))

        any_live_ok = any(ok for _, _, _, ok in day_results)
        any_flights = any(len(opts) > 0 for _, opts, _, _ in day_results)
        primary_source = next((src for _, opts, src, ok in day_results if ok and opts), "Google Flights (Live)")

        if any_live_ok and not any_flights:
            result = {
                "route": f"{dep_code} to {arr_code}",
                "status": "no_flights_found",
                "data_source": primary_source,
                "trip_type": "one_way_7day_flexible",
                "window": f"{date_list[0]} to {date_list[-1]}",
                "travellers": adults,
                "currency": currency,
                "message": f"No scheduled commercial flights found on Google Flights for {dep_code} to {arr_code} between {date_list[0]} and {date_list[-1]}.",
                "booking_link": verify_url,
                "cheapest_option": None,
                "daily_flights": [],
            }
            self._set_cached(cache_key, result)
            return result

        if not any_live_ok:
            duration_min, base_fare_pp = self._compute_distance_estimate(dep_code, arr_code)
            return {
                "route": f"{dep_code} to {arr_code}",
                "status": "estimated_only",
                "data_source": "Offline Estimate (Live search temporarily unreachable)",
                "trip_type": "one_way_7day_flexible",
                "window": f"{date_list[0]} to {date_list[-1]}",
                "travellers": adults,
                "currency": currency,
                "estimated_fare_per_person": base_fare_pp,
                "estimated_duration": f"~{duration_min // 60}h {duration_min % 60}m",
                "booking_link": verify_url,
                "daily_flights": [],
            }

        daily_schedule: list[dict[str, Any]] = []
        cheapest_overall: dict[str, Any] | None = None

        for d_str, opts, _, _ in day_results:
            day_name = datetime.strptime(d_str, "%Y-%m-%d").strftime("%A")
            if not opts:
                daily_schedule.append({
                    "date": d_str,
                    "day": day_name,
                    "lowest_fare": None,
                    "flights": [],
                })
                continue

            min_flight = opts[0]
            if cheapest_overall is None or min_flight["price"] < cheapest_overall["price"]:
                cheapest_overall = {
                    "date": d_str,
                    "day": day_name,
                    "airline": min_flight["airline"],
                    "flight_number": min_flight["flight_number"],
                    "departure": min_flight["departure"],
                    "stops": min_flight["stops"],
                    "price": min_flight["price"],
                }

            daily_schedule.append({
                "date": d_str,
                "day": day_name,
                "lowest_fare": min_flight["price"],
                "flights": opts,
            })

        result = {
            "route": f"{dep_code} to {arr_code}",
            "status": "ok",
            "data_source": primary_source,
            "trip_type": "one_way_7day_flexible",
            "window": f"{date_list[0]} to {date_list[-1]}",
            "travellers": adults,
            "currency": currency,
            "booking_link": verify_url,
            "cheapest_option": cheapest_overall,
            "daily_flights": daily_schedule,
        }
        self._set_cached(cache_key, result)
        return result

    def search_hotels(
        self,
        destination: str,
        check_in_date: str,
        check_out_date: str,
        adults: int = 1,
        rooms: int = 1,
        currency: str = "INR",
        location_preference: str = "tourist_attraction",
    ) -> dict[str, Any]:
        """Search hotels in the destination city with nightly and total prices, filtered by location preference."""
        try:
            d1 = datetime.strptime(check_in_date, "%Y-%m-%d")
            d2 = datetime.strptime(check_out_date, "%Y-%m-%d")
            nights = max(1, (d2 - d1).days)
        except Exception:
            nights = 1

        rooms = max(1, int(rooms))
        clean_city = destination.split(",")[0].strip()
        clean_lower = clean_city.lower()

        hotels = []
        if location_preference == "near_airport":
            curated_airport = NEAR_AIRPORT_HOTELS.get(clean_lower, [])
            if curated_airport:
                for item in curated_airport[:3]:
                    nightly = int(item["base"])
                    hotels.append({
                        "name": item["name"],
                        "type": item["type"],
                        "rating": item.get("rating", 4.3),
                        "nightly_rate": nightly,
                        "total_price": nightly * nights * rooms,
                        "proximity": item.get("proximity", "Near Airport Terminal / Transit"),
                    })

        if not hotels:
            hotel_names = []
            search_query = f"airport hotel {clean_city}" if location_preference == "near_airport" else f"hotel {clean_city}"
            try:
                r = requests.get(
                    self.PHOTON_URL,
                    params={"q": search_query, "limit": "6"},
                    headers={"User-Agent": "TravelPlanner/1.0"},
                    timeout=self.timeout,
                )
                if r.ok:
                    for feat in r.json().get("features", []):
                        name = feat.get("properties", {}).get("name")
                        if name and name not in hotel_names:
                            hotel_names.append(name)
            except Exception:
                pass

            if not hotel_names:
                if location_preference == "near_airport":
                    hotel_names = [f"Airport Transit Hotel {clean_city}", f"The Gateway Hotel Airport {clean_city}", f"Aerocity Express {clean_city}"]
                else:
                    hotel_names = [f"Hotel {clean_city} Residency", f"The Royal Orchid {clean_city}", f"Ginger Hotel {clean_city}"]

            tiers = [
                {"type": "Budget Transit" if location_preference == "near_airport" else "Budget Comfort", "base": 1800 if location_preference == "near_airport" else 1600, "rating": 4.1},
                {"type": "Business Airport Stay" if location_preference == "near_airport" else "Mid-Range Premium", "base": 3200 if location_preference == "near_airport" else 2800, "rating": 4.4},
                {"type": "Luxury Terminal Hotel" if location_preference == "near_airport" else "Luxury Heritage", "base": 5500 if location_preference == "near_airport" else 4900, "rating": 4.7},
            ]

            for i, name in enumerate(hotel_names[:3]):
                tier = tiers[i % len(tiers)]
                nightly = int(str(tier["base"])) + (i * 200)
                total = nightly * nights * rooms
                hotels.append({
                    "name": name,
                    "type": tier["type"],
                    "rating": tier["rating"],
                    "nightly_rate": nightly,
                    "total_price": total,
                    "proximity": "Near Airport" if location_preference == "near_airport" else "Central / Tourist Sightseeing Area",
                })

        return {
            "destination": clean_city,
            "nights": nights,
            "rooms": rooms,
            "location_preference": "Near Airport" if location_preference == "near_airport" else "Near Tourist Sights / City Center",
            "hotels": hotels,
        }

    def search_attractions(self, destination: str, limit: int = 5) -> dict[str, Any]:
        """Get destination summary and top attractions."""
        _, _, formatted = self._geocode(destination)
        clean = destination.split(",")[0].strip().lower()
        summary = self._get_wiki_snapshot(clean)

        attractions = []
        if clean in TOP_INDIAN_DESTINATIONS:
            attractions = TOP_INDIAN_DESTINATIONS[clean]["attractions"][:limit]

        if not attractions:
            try:
                r = requests.get(
                    self.PHOTON_URL,
                    params={"q": f"tourism {clean}", "limit": str(limit)},
                    headers={"User-Agent": "TravelPlanner/1.0"},
                    timeout=self.timeout,
                )
                if r.ok:
                    for f in r.json().get("features", []):
                        name = f.get("properties", {}).get("name")
                        if name:
                            attractions.append({"name": name, "highlight": f"Popular landmark in {clean.title()}."})
            except Exception:
                pass

        return {
            "destination": formatted,
            "summary": summary,
            "attractions": attractions[:limit],
        }

    def search_restaurants(self, destination: str, limit: int = 4) -> dict[str, Any]:
        """Find popular dining options around the destination."""
        clean = destination.split(",")[0].strip().lower()
        restaurants = []
        if clean in TOP_INDIAN_DESTINATIONS:
            restaurants = TOP_INDIAN_DESTINATIONS[clean].get("restaurants", [])[:limit]

        if not restaurants:
            try:
                r = requests.get(
                    self.PHOTON_URL,
                    params={"q": f"restaurant {clean}", "limit": str(limit)},
                    headers={"User-Agent": "TravelPlanner/1.0"},
                    timeout=self.timeout,
                )
                if r.ok:
                    for f in r.json().get("features", []):
                        name = f.get("properties", {}).get("name")
                        if name:
                            restaurants.append({"name": name, "cuisine": "Local & Multi-Cuisine"})
            except Exception:
                pass

        return {
            "destination": destination.title(),
            "restaurants": restaurants[:limit],
        }

    def run_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        """Dispatch requested tool execution safely."""
        dispatch = {
            "search_flights": self.search_flights,
            "search_weekly_flights": self.search_weekly_flights,
            "search_hotels": self.search_hotels,
            "search_restaurants": self.search_restaurants,
            "search_attractions": self.search_attractions,
        }
        func: Any = dispatch.get(tool_name)
        if func is None:
            raise ValueError(f"Unknown tool: {tool_name}")
        return func(**arguments)
