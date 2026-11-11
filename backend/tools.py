"""Travel search tools: Indian Flights, Hotels, Attractions, and Restaurants."""

from __future__ import annotations

import math
import urllib.parse
from datetime import datetime, timedelta
from typing import Any

import airportsdata
import requests

from log import log_step


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
    """Provides travel search tools without requiring third-party subscriptions."""

    PHOTON_URL = "https://photon.komoot.io/api/"
    WIKIPEDIA_REST_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/"

    DOMESTIC_AIRLINES = [
        {"name": "IndiGo", "code": "6E", "factor": 1.0, "slots": ["06:15", "09:30", "14:15", "18:45"]},
        {"name": "Air India", "code": "AI", "factor": 1.15, "slots": ["07:45", "11:20", "16:40", "19:50"]},
        {"name": "Akasa Air", "code": "QP", "factor": 0.95, "slots": ["08:10", "13:00", "17:30"]},
        {"name": "SpiceJet", "code": "SG", "factor": 0.92, "slots": ["05:50", "12:15", "20:00"]},
    ]

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.airports = airportsdata.load("IATA")

    def resolve_airport_code(self, place: str) -> str:
        """Resolve a city or airport name to an IATA 3-letter code."""
        value = place.strip()
        if len(value) == 3 and value.isalpha():
            return value.upper()

        needle = value.casefold()
        matches: list[tuple[str, Any]] = []
        for code, airport in self.airports.items():
            city = str(getattr(airport, "city", "") if not isinstance(airport, dict) else airport.get("city", "")).casefold()
            name = str(getattr(airport, "name", "") if not isinstance(airport, dict) else airport.get("name", "")).casefold()
            if needle == city or needle == name:
                matches.append((code, airport))

        if not matches:
            for code, airport in self.airports.items():
                city = str(getattr(airport, "city", "") if not isinstance(airport, dict) else airport.get("city", "")).casefold()
                name = str(getattr(airport, "name", "") if not isinstance(airport, dict) else airport.get("name", "")).casefold()
                if needle in city or needle in name:
                    matches.append((code, airport))

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

    # Day-of-week demand pricing multipliers (0=Monday ... 6=Sunday)
    WEEKDAY_PRICE_FACTORS: dict[int, float] = {
        0: 0.96,  # Monday
        1: 0.86,  # Tuesday (midweek dip)
        2: 0.88,  # Wednesday
        3: 0.94,  # Thursday
        4: 1.15,  # Friday (weekend rush)
        5: 1.08,  # Saturday
        6: 1.20,  # Sunday (peak rush)
    }

    def _compute_route_metrics(self, origin: str, destination: str) -> tuple[str, str, int, int]:
        """Resolve airport codes and calculate flight duration (min) and base fare (INR)."""
        dep_code = self.resolve_airport_code(origin)
        arr_code = self.resolve_airport_code(destination)

        dep_info: Any = self.airports.get(dep_code, {})
        arr_info: Any = self.airports.get(arr_code, {})
        lat1 = float(getattr(dep_info, "lat", 20.0) if not isinstance(dep_info, dict) else dep_info.get("lat", 20.0))
        lon1 = float(getattr(dep_info, "lon", 78.0) if not isinstance(dep_info, dict) else dep_info.get("lon", 78.0))
        lat2 = float(getattr(arr_info, "lat", 20.0) if not isinstance(arr_info, dict) else arr_info.get("lat", 20.0))
        lon2 = float(getattr(arr_info, "lon", 78.0) if not isinstance(arr_info, dict) else arr_info.get("lon", 78.0))
        dist_km = self._haversine_distance_km(lat1, lon1, lat2, lon2)

        duration_min = max(45, round((dist_km / 720.0) * 60.0 + 35.0))
        base_fare_pp = max(2800, round(2200 + (dist_km * 3.8) + 450))
        return dep_code, arr_code, duration_min, base_fare_pp

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
        """Search flight routes and calculate realistic flight schedules and fares."""
        dep_code, arr_code, duration_min, base_fare_pp = self._compute_route_metrics(origin, destination)
        adults = max(1, int(adults))
        is_round_trip = (trip_type in ("round_trip", "roundtrip")) or bool(return_date)

        outbound: list[dict[str, Any]] = []
        for i, carrier in enumerate(self.DOMESTIC_AIRLINES[:3]):
            slots: list[str] = carrier["slots"]  # type: ignore[assignment]
            factor: float = float(str(carrier["factor"]))
            code: str = str(carrier["code"])
            name: str = str(carrier["name"])

            slot = slots[i % len(slots)]
            dep_dt = datetime.strptime(f"{departure_date} {slot}", "%Y-%m-%d %H:%M")
            arr_dt = dep_dt + timedelta(minutes=duration_min)

            price_pp = round(base_fare_pp * factor + (i * 150))
            seed = sum(ord(c) for c in f"{dep_code}{arr_code}")
            flight_no = f"{code}-{100 + ((seed * 31 + i * 19) % 899)}"

            outbound.append({
                "airline": name,
                "flight_number": flight_no,
                "departure": dep_dt.strftime("%H:%M"),
                "arrival": arr_dt.strftime("%H:%M"),
                "duration": f"{duration_min // 60}h {duration_min % 60}m",
                "price": price_pp * adults,
            })

        outbound.sort(key=lambda x: x["price"])

        if is_round_trip and return_date:
            ret_slot = "15:30"
            ret_dep_dt = datetime.strptime(f"{return_date} {ret_slot}", "%Y-%m-%d %H:%M")
            ret_arr_dt = ret_dep_dt + timedelta(minutes=duration_min)
            for opt in outbound:
                opt["return_flight"] = {
                    "airline": opt["airline"],
                    "departure": ret_dep_dt.strftime("%H:%M"),
                    "arrival": ret_arr_dt.strftime("%H:%M"),
                    "duration": f"{duration_min // 60}h {duration_min % 60}m",
                }
                opt["round_trip_price_total"] = opt["price"] * 2

        return {
            "route": f"{dep_code} to {arr_code}",
            "trip_type": "round_trip" if is_round_trip else "one_way",
            "departure_date": departure_date,
            "return_date": return_date if is_round_trip else None,
            "travellers": adults,
            "currency": currency,
            "options": outbound,
        }

    def search_weekly_flights(
        self,
        origin: str,
        destination: str,
        start_date: str,
        adults: int = 1,
        days: int = 7,
        currency: str = "INR",
    ) -> dict[str, Any]:
        """Search one-way flights across a flexible 7-day window starting at start_date."""
        dep_code, arr_code, duration_min, base_fare_pp = self._compute_route_metrics(origin, destination)
        adults = max(1, int(adults))
        days = max(1, min(int(days), 7))
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")

        daily_schedule: list[dict[str, Any]] = []
        cheapest_overall: dict[str, Any] | None = None

        for offset in range(days):
            cur_dt = start_dt + timedelta(days=offset)
            cur_date_str = cur_dt.strftime("%Y-%m-%d")
            day_name = cur_dt.strftime("%A")
            day_factor = self.WEEKDAY_PRICE_FACTORS.get(cur_dt.weekday(), 1.0)

            day_flights: list[dict[str, Any]] = []
            for idx, carrier in enumerate(self.DOMESTIC_AIRLINES[:3]):
                slots: list[str] = carrier["slots"]  # type: ignore[assignment]
                carrier_factor = float(str(carrier["factor"]))
                code = str(carrier["code"])
                name = str(carrier["name"])

                slot = slots[(idx + offset) % len(slots)]
                dep_dt = datetime.strptime(f"{cur_date_str} {slot}", "%Y-%m-%d %H:%M")
                arr_dt = dep_dt + timedelta(minutes=duration_min)

                price_pp = round(base_fare_pp * carrier_factor * day_factor + (idx * 120))
                total_price = price_pp * adults
                seed = sum(ord(c) for c in f"{dep_code}{arr_code}")
                flight_no = f"{code}-{100 + ((seed * 37 + idx * 17 + offset * 13) % 899)}"

                day_flights.append({
                    "airline": name,
                    "flight_no": flight_no,
                    "dep": dep_dt.strftime("%H:%M"),
                    "arr": arr_dt.strftime("%H:%M"),
                    "dur": f"{duration_min // 60}h {duration_min % 60}m",
                    "price": total_price,
                })

            day_flights.sort(key=lambda x: x["price"])
            min_flight = day_flights[0]

            if cheapest_overall is None or min_flight["price"] < cheapest_overall["price"]:
                cheapest_overall = {
                    "date": cur_date_str,
                    "day": day_name,
                    "airline": min_flight["airline"],
                    "flight_no": min_flight["flight_no"],
                    "dep": min_flight["dep"],
                    "price": min_flight["price"],
                }

            daily_schedule.append({
                "date": cur_date_str,
                "day": day_name,
                "lowest_fare": min_flight["price"],
                "flights": day_flights,
            })

        return {
            "route": f"{dep_code} to {arr_code}",
            "trip_type": "one_way_7day_flexible",
            "window": f"{start_date} to {(start_dt + timedelta(days=days - 1)).strftime('%Y-%m-%d')}",
            "travellers": adults,
            "currency": currency,
            "cheapest_option": cheapest_overall,
            "daily_flights": daily_schedule,
        }

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
