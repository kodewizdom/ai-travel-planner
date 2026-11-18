// Curated destination data, imagery, and attractions for Indian domestic destinations

export const DESTINATION_IMAGES = {
  "patna": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1500&q=85",
  "amritsar": "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1500&q=85",
  "varanasi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1500&q=85",
  "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1500&q=85",
  "mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1500&q=85",
  "jaipur": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1500&q=85",
  "udaipur": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1500&q=85",
  "agra": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1500&q=85",
  "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1500&q=85",
  "bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1500&q=85",
  "bangalore": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1500&q=85",
  "hyderabad": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1500&q=85",
  "kolkata": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1500&q=85",
  "chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1500&q=85",
  "srinagar": "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1500&q=85",
  "kochi": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1500&q=85",
  "cochin": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1500&q=85",
  "shimla": "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=1500&q=85",
  "manali": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1500&q=85",
  "rishikesh": "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1500&q=85",
  "lucknow": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1500&q=85",
  "ahmedabad": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1500&q=85",
  "pune": "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1500&q=85",
  "chandigarh": "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=1500&q=85",
  "bhopal": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1500&q=85",
  "bhubaneswar": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1500&q=85",
  "indore": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1500&q=85",
  "ooty": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1500&q=85",
  "darjeeling": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1500&q=85",
  "alleppey": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1500&q=85"
};

const wikiImageCache = {};

export async function fetchWikipediaImage(city) {
  if (!city) return null;
  const cleanCity = city.split(',')[0].replace(/\([^)]*\)/g, '').trim();
  if (wikiImageCache[cleanCity] !== undefined) return wikiImageCache[cleanCity];

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=1500&redirects=1&format=json&origin=*&titles=${encodeURIComponent(cleanCity)}`;
    const res = await fetch(url);
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    const src = page?.thumbnail?.source || null;
    wikiImageCache[cleanCity] = src;
    return src;
  } catch {
    wikiImageCache[cleanCity] = null;
    return null;
  }
}

export function getCityHeroImage(city) {
  if (!city) return null;
  const key = city.split(',')[0].replace(/\([^)]*\)/g, '').trim().toLowerCase();
  return DESTINATION_IMAGES[key] || "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1500&q=85";
}

export const DEFAULT_INDIA_BANNERS = [
  {
    title: "City Palace, Udaipur",
    state: "Rajasthan",
    tagline: "Illuminated grandeur on the serene banks of Lake Pichola",
    image: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Lake Pichola", "City Palace", "Jag Mandir"]
  },
  {
    title: "Hawa Mahal, Jaipur",
    state: "Rajasthan",
    tagline: "The iconic Palace of Winds in the Pink City",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    highlights: ["953 Jharokhas", "Royal Heritage", "Old City Bazaars"]
  },
  {
    title: "Alleppey Backwaters",
    state: "Kerala",
    tagline: "Serene canals and traditional houseboats",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Houseboat Cruises", "Palm Groves", "Ayurvedic Wellness"]
  },
  {
    title: "Dal Lake, Srinagar",
    state: "Jammu & Kashmir",
    tagline: "Jewel in the crown of Kashmir",
    image: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Shikara Rides", "Floating Markets", "Mughal Gardens"]
  },
  {
    title: "Varanasi Ghats",
    state: "Uttar Pradesh",
    tagline: "Spiritual heart on the holy banks of the Ganges",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Evening Ganga Aarti", "Boat Rides", "Ancient Temples"]
  },
  {
    title: "Goa Coastline",
    state: "Goa",
    tagline: "Golden sands, historic forts, and coastal sunsets",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Sun-Kissed Beaches", "Portuguese Architecture", "Seafood Shacks"]
  }
];

export const DESTINATION_DETAILS = {
  "Udaipur": {
    banners: [
      {
        title: "City Palace, Udaipur",
        state: "Rajasthan",
        tagline: "Illuminated grandeur on the serene banks of Lake Pichola",
        image: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Lake Pichola", "City Palace", "Jag Mandir"]
      },
      {
        title: "Lake Pichola & Jag Mandir",
        state: "Rajasthan",
        tagline: "Historic island palace amidst shimmering waters",
        image: "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Sunset Boat Cruises", "Island Palace", "Panoramic Aravalli Hills"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-720",
        departureTime: "06:30",
        arrivalTime: "08:45",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 4890,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Top Value"
      },
      {
        airline: "Air India",
        flightNo: "AI-471",
        departureTime: "13:10",
        arrivalTime: "15:25",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 5450,
        aircraft: "Airbus A320",
        baggage: "7kg Cabin · 25kg Check-in",
        status: "Free Meal"
      },
      {
        airline: "SpiceJet",
        flightNo: "SG-2831",
        departureTime: "17:45",
        arrivalTime: "20:00",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 4320,
        aircraft: "Boeing 737-800",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Cheapest"
      }
    ],
    hotels: [
      {
        name: "Taj Lake Palace",
        category: "5-Star Heritage Luxury",
        location: "Lake Pichola, Udaipur",
        rating: 4.9,
        reviewsCount: 3820,
        pricePerNight: 28500,
        amenities: ["Island Palace", "Royal Butler Service", "Heritage Spa", "Fine Dining"],
        description: "An iconic 18th-century marble palace floating serenely on Lake Pichola with world-class hospitality."
      },
      {
        name: "The Oberoi Udaivilas",
        category: "5-Star Premier Palace Resort",
        location: "Haridas Ji Ki Magri, Udaipur",
        rating: 4.9,
        reviewsCount: 4150,
        pricePerNight: 32000,
        amenities: ["Private Pool Suites", "Aravalli Views", "Luxury Spa", "Lakeside Pavilions"],
        description: "Opulent palatial courtyards, decorative fountains, and sprawling reflection pools overlooking Lake Pichola."
      },
      {
        name: "Jagat Niwas Palace",
        category: "Heritage Haveli Stay",
        location: "Lal Ghat, Udaipur",
        rating: 4.6,
        reviewsCount: 1650,
        pricePerNight: 6800,
        amenities: ["Jharokha Lake Views", "Rooftop Restaurant", "Ayurvedic Center", "Old City Location"],
        description: "Restored 17th-century haveli situated directly on the eastern banks with quintessential Mewar charm."
      }
    ],
    restaurants: [
      {
        name: "Ambrai Restaurant",
        cuisine: "North Indian & Mewari Specialties",
        location: "Amet Haveli, Lake Pichola",
        rating: 4.8,
        reviewsCount: 5200,
        priceForTwo: 2200,
        mustTry: ["Laal Maas", "Mewari Kadhai Paneer", "Ambrai Chicken", "Garlic Naan"],
        ambience: "Legendary waterfront open-air dining with uninterrupted views of City Palace and Lake Palace."
      },
      {
        name: "Upre by 1559 AD",
        cuisine: "Rajasthani & Continental Dining",
        location: "Roof Top Lake Pichola Hotel, Outside Chandpole",
        rating: 4.7,
        reviewsCount: 3400,
        priceForTwo: 1900,
        mustTry: ["Rajasthani Thali", "Ker Sangri", "Stuffed Malai Kofta"],
        ambience: "Romantic rooftop cabanas with panoramic city vistas and authentic royal recipes."
      },
      {
        name: "Millets of Mewar",
        cuisine: "Healthy Organic & Traditional Rajasthani",
        location: "Hanuman Ghat, Udaipur",
        rating: 4.6,
        reviewsCount: 1980,
        priceForTwo: 850,
        mustTry: ["Millet Roti Thali", "Raw Papaya Salad", "Local Kheer"],
        ambience: "Health-focused, eco-friendly cafe serving gluten-free and regional heritage delicacies."
      }
    ],
    attractions: [
      {
        name: "City Palace Complex",
        category: "Royal Heritage & Museum",
        location: "Old City, Udaipur",
        timings: "09:00 AM - 05:30 PM",
        entryFee: "₹300 (Adults)",
        highlights: "Rajasthan's largest palace complex featuring ornate courtyards, mirror-work pavilions, and panoramic lake vistas."
      },
      {
        name: "Lake Pichola & Jag Mandir",
        category: "Scenic Lake & Island Landmark",
        location: "Lake Pichola, Udaipur",
        timings: "09:00 AM - 06:00 PM",
        entryFee: "₹400 (Boat Ride)",
        highlights: "Picturesque boat cruises offering views of royal ghats, floating palaces, and dramatic sunset over Aravalli hills."
      },
      {
        name: "Saheliyon-ki-Bari",
        category: "Historical Royal Gardens",
        location: "Saheli Marg, Udaipur",
        timings: "08:00 AM - 07:00 PM",
        entryFee: "₹20 (Indians)",
        highlights: "Historic lush gardens constructed with marble elephant fountains, lotus pools, and shaded pavilions."
      },
      {
        name: "Bagore Ki Haveli",
        category: "Cultural Museum & Folk Dance",
        location: "Gangaur Ghat, Udaipur",
        timings: "09:30 AM - 05:30 PM (Dharohar Dance: 07:00 PM)",
        entryFee: "₹100 (Day Museum) · ₹150 (Evening Show)",
        highlights: "18th-century lakeside haveli hosting nightly vibrant Rajasthani Dharohar folk and puppet performances."
      }
    ]
  },
  "Goa": {
    banners: [
      {
        title: "Palolem Beach, Canacona",
        state: "South Goa",
        tagline: "Crescent white-sand bay flanked by coconut palms",
        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Calm Waters", "Dolphin Watching", "Beach Huts"]
      },
      {
        title: "Fort Aguada & Lighthouse",
        state: "North Goa",
        tagline: "17th-century Portuguese fortress overlooking the Arabian Sea",
        image: "https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Panoramic Sea Views", "Historic Jail & Fort", "Sunset Spot"]
      },
      {
        title: "Dudhsagar Waterfalls",
        state: "Sanguem, Goa",
        tagline: "Four-tiered majestic cascading sea of milk",
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Western Ghats Trek", "Railway Bridge View", "Jeep Safari"]
      },
      {
        title: "Basilica of Bom Jesus",
        state: "Old Goa",
        tagline: "UNESCO heritage landmark holding the mortal remains of St. Francis Xavier",
        image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Baroque Architecture", "Historic Altars", "Museum"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-2054",
        departureTime: "06:15",
        arrivalTime: "08:45",
        duration: "2h 30m",
        stops: "Non-stop",
        price: 5490,
        aircraft: "Airbus A321neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Available"
      },
      {
        airline: "Akasa Air",
        flightNo: "QP-1372",
        departureTime: "11:20",
        arrivalTime: "13:40",
        duration: "2h 20m",
        stops: "Non-stop",
        price: 4899,
        aircraft: "Boeing 737 MAX 8",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Best Value"
      },
      {
        airline: "Air India",
        flightNo: "AI-883",
        departureTime: "16:45",
        arrivalTime: "19:15",
        duration: "2h 30m",
        stops: "Non-stop",
        price: 6120,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Complimentary Meal"
      },
      {
        airline: "SpiceJet",
        flightNo: "SG-312",
        departureTime: "19:30",
        arrivalTime: "22:05",
        duration: "2h 35m",
        stops: "Non-stop",
        price: 5150,
        aircraft: "Boeing 737-800",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Late Evening"
      }
    ],
    hotels: [
      {
        name: "Taj Exotica Resort & Spa",
        category: "Luxury 5-Star Beach Resort",
        location: "Benaulim, South Goa",
        rating: 4.8,
        reviewsCount: 3420,
        pricePerNight: 16500,
        amenities: ["Private Beach", "Jiva Spa", "Free Wi-Fi", "Swimming Pool", "Breakfast Included"],
        description: "Mediterranean-inspired seaside resort sprawled across 56 acres along the pristine Benaulim shore."
      },
      {
        name: "W Goa",
        category: "Boutique Luxury Hotel",
        location: "Vagator Beach, North Goa",
        rating: 4.7,
        reviewsCount: 2180,
        pricePerNight: 18200,
        amenities: ["Rock Pool", "Spa by Clarins", "Fitness Center", "Sea View Suites"],
        description: "Vibrant coastal retreat overlooking the red cliffs of Vagator Beach with renowned sunset vistas."
      },
      {
        name: "Santana Beach Resort",
        category: "Mid-Range Beachfront Hotel",
        location: "Candolim Beach, North Goa",
        rating: 4.4,
        reviewsCount: 1540,
        pricePerNight: 4800,
        amenities: ["Two Swimming Pools", "Direct Beach Access", "Olegario's Restaurant", "Free Wi-Fi"],
        description: "Lush tropical gardens and cozy Portuguese-styled villas steps away from Candolim Beach."
      },
      {
        name: "The Park Baga River",
        category: "Boutique Transit & Leisure Stay",
        location: "Arpora / Baga River",
        rating: 4.3,
        reviewsCount: 980,
        pricePerNight: 3950,
        amenities: ["Infinity Pool", "Riverfront Dining", "Airport Shuttle", "Cocktail Lounge"],
        description: "Adults-only peaceful riverside sanctuary minutes from lively North Goa beaches and night markets."
      }
    ],
    restaurants: [
      {
        name: "Gunpowder",
        cuisine: "Peninsular Indian & Coastal Kerala/Goan",
        location: "Assagao, North Goa",
        priceForTwo: 1800,
        rating: 4.7,
        reviewsCount: 3850,
        mustTry: ["Kerala Mutton Curry", "Appams", "Prawn Pepper Fry", "Toddy Shop Beef Roast"],
        ambience: "Open-air heritage Portuguese courtyard with leafy canopy and bohemian vibes."
      },
      {
        name: "Fisherman's Wharf",
        cuisine: "Goan Seafood & Continental",
        location: "Cavelossim / Panaji",
        priceForTwo: 2200,
        rating: 4.6,
        reviewsCount: 4620,
        mustTry: ["Goan Fish Curry with Rice", "Butter Garlic Crab", "Kingfish Recheado", "Bebinca"],
        ambience: "Riverside deck dining with live Goan music and fresh day's catch display."
      },
      {
        name: "Vinayak Family Restaurant",
        cuisine: "Authentic Local Goan Thali",
        location: "Assagao",
        priceForTwo: 700,
        rating: 4.5,
        reviewsCount: 2980,
        mustTry: ["Special Fish Thali", "Chonak Rava Fry", "Sol Kadhi", "Squid Masala"],
        ambience: "Casual local diner packed with locals and connoisseurs seeking genuine home-style flavors."
      },
      {
        name: "Antares Restaurant & Beach Club",
        cuisine: "Australian-Asian Coastal Fusion",
        location: "Small Vagator Cliff",
        priceForTwo: 2800,
        rating: 4.6,
        reviewsCount: 3200,
        mustTry: ["Wood-fired Truffle Pizza", "Charred Octopus", "Signature Sunset Cocktails"],
        ambience: "Clifftop open-air terrace with sweeping Arabian Sea sunset panoramas."
      }
    ],
    attractions: [
      {
        name: "Fort Aguada & Lighthouse",
        category: "Historic Monument & Panorama",
        location: "Sinquerim, Candolim",
        timings: "09:30 AM - 05:30 PM",
        entryFee: "₹25 (Indians) · Free for Children",
        highlights: "Overlooks the confluence of the Mandovi River and Arabian Sea. Intact 1612 freshwater cistern."
      },
      {
        name: "Basilica of Bom Jesus & Old Goa",
        category: "UNESCO World Heritage Site",
        location: "Old Goa",
        timings: "09:00 AM - 06:30 PM",
        entryFee: "Free Entry · ₹10 for Art Gallery",
        highlights: "Centuries-old baroque architecture housing the sacred relics of St. Francis Xavier."
      },
      {
        name: "Dudhsagar Waterfalls Trek & Safari",
        category: "Nature & Adventure Excursion",
        location: "Sonaulim, South Goa",
        timings: "08:00 AM - 04:30 PM",
        entryFee: "₹500 per person for Jeep Safari + Forest Entry",
        highlights: "One of India's tallest waterfalls situated inside Bhagwan Mahavir Wildlife Sanctuary."
      },
      {
        name: "Anjuna Flea Market & Curlies Sunset",
        category: "Culture, Music & Local Shopping",
        location: "Anjuna Beach",
        timings: "09:00 AM - 11:00 PM",
        entryFee: "Free Entry",
        highlights: "Handicrafts, handmade jewelry, spices, live music, and authentic coastal street energy."
      }
    ]
  },
  "Jaipur": {
    banners: [
      {
        title: "Hawa Mahal (Palace of Winds)",
        state: "Jaipur, Rajasthan",
        tagline: "Five-story pink sandstone wonder with 953 ornate windows",
        image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Honeycomb Facade", "Old City Bazaars", "Wind Breezeways"]
      },
      {
        title: "Amer Fort & Maota Lake",
        state: "Amer, Jaipur",
        tagline: "Opulent hilltop fort with Sheesh Mahal and grand courtyards",
        image: "https://images.unsplash.com/photo-1603288967676-e91851e2bc00?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Mirror Palace (Sheesh Mahal)", "Elephant Path", "Light & Sound Show"]
      },
      {
        title: "Jal Mahal (Water Palace)",
        state: "Man Sagar Lake, Jaipur",
        tagline: "Submerged Rajput palace floating peacefully on tranquil waters",
        image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Sunset Promenade", "Migratory Birds", "Handicraft Stalls"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-6184",
        departureTime: "07:10",
        arrivalTime: "08:15",
        duration: "1h 05m",
        stops: "Non-stop",
        price: 3620,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Morning Express"
      },
      {
        airline: "Air India",
        flightNo: "AI-491",
        departureTime: "14:20",
        arrivalTime: "15:25",
        duration: "1h 05m",
        stops: "Non-stop",
        price: 4150,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Best Scheduled"
      },
      {
        airline: "SpiceJet",
        flightNo: "SG-2981",
        departureTime: "18:50",
        arrivalTime: "19:55",
        duration: "1h 05m",
        stops: "Non-stop",
        price: 3499,
        aircraft: "Bombardier Q400",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Economy Deal"
      }
    ],
    hotels: [
      {
        name: "Rambagh Palace (IHCL)",
        category: "Royal Heritage 5-Star Palace",
        location: "Bhawani Singh Road, Jaipur",
        rating: 4.9,
        reviewsCount: 4120,
        pricePerNight: 32000,
        amenities: ["Royal Peacock Gardens", "Jiva Grande Spa", "Suvarna Mahal Fine Dining", "Butler Service"],
        description: "Former residence of the Maharaja of Jaipur, renowned as one of the finest heritage hotels in the world."
      },
      {
        name: "Alsisar Haveli",
        category: "Traditional Heritage Haveli",
        location: "Sansar Chandra Road",
        rating: 4.6,
        reviewsCount: 1840,
        pricePerNight: 6800,
        amenities: ["Courtyard Swimming Pool", "Intricate Frescoes", "Rooftop Restaurant", "Free Wi-Fi"],
        description: "Restored 19th-century royal haveli showcasing Rajasthani architecture, antique chandeliers, and tranquility."
      },
      {
        name: "Holiday Inn Jaipur City Centre",
        category: "Modern Business & Family Stay",
        location: "22 Godam Circle, Jaipur",
        rating: 4.5,
        reviewsCount: 2200,
        pricePerNight: 4900,
        amenities: ["Outdoor Pool", "Chao Chinese Bistro", "Fitness Center", "Airport Proximity"],
        description: "Contemporary comfort and swift connectivity to Jaipur Junction and major historical palaces."
      }
    ],
    restaurants: [
      {
        name: "1135 AD, Amer Fort",
        cuisine: "Royal Rajputana Fine Dining",
        location: "Amer Fort Complex",
        priceForTwo: 3500,
        rating: 4.7,
        reviewsCount: 2180,
        mustTry: ["Laal Maas", "Safed Maas", "Amer Murgh Tikka", "Gulab Jamun Flambé"],
        ambience: "Silver-plated furniture, gold leaf embellishments, and live sitar music inside Amer Fort."
      },
      {
        name: "Laxmi Mishthan Bhandar (LMB)",
        cuisine: "Traditional Rajasthani Thali & Sweets",
        location: "Johari Bazaar, Old City",
        priceForTwo: 900,
        rating: 4.5,
        reviewsCount: 5400,
        mustTry: ["Royal Rajasthani Thali", "Dal Baati Churma", "Paneer Ghewar", "Pyaaz Kachori"],
        ambience: "Iconic century-old restaurant and confectionery in the middle of Jaipur's jeweler hub."
      },
      {
        name: "Bar Palladio Jaipur",
        cuisine: "Italian & Craft Cocktails",
        location: "Narain Niwas Palace Hotel",
        priceForTwo: 2400,
        rating: 4.6,
        reviewsCount: 3100,
        mustTry: ["Gnocchi with Gorgonzola", "Classic Tiramisu", "Palladio Negroni"],
        ambience: "Cobalt blue oriental interiors designed by Marie-Anne Oudejans, peacock courtyards, and romantic candlelit seating."
      }
    ],
    attractions: [
      {
        name: "Amer Fort & Sheesh Mahal",
        category: "UNESCO World Heritage Hill Fort",
        location: "Amer, Jaipur",
        timings: "08:00 AM - 05:30 PM",
        entryFee: "₹100 (Indians) · ₹500 (Foreigners)",
        highlights: "Enthralling mirror palace where a single candle illuminates the entire chamber."
      },
      {
        name: "City Palace & Chandra Mahal",
        category: "Royal Residence & Museum",
        location: "Gangori Bazaar, Old City",
        timings: "09:30 AM - 05:00 PM",
        entryFee: "₹200 (Courtyards) · Private Palace tours available",
        highlights: "Spectacular Peacock Gate, royal weapon armory, and textiles museum."
      },
      {
        name: "Jantar Mantar Astronomical Observatory",
        category: "UNESCO World Heritage Site",
        location: "Near City Palace, Jaipur",
        timings: "09:00 AM - 05:00 PM",
        entryFee: "₹50 (Indians) · ₹200 (Foreigners)",
        highlights: "World's largest stone sundial constructed by Maharaja Sawai Jai Singh II in 1734."
      }
    ]
  },
  "Delhi": {
    banners: [
      {
        title: "India Gate & Kartavya Path",
        state: "New Delhi",
        tagline: "Majestic war memorial archway in the heart of the national capital",
        image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Eternal Flame (Amar Jawan)", "Evening Fountains", "Historic Canals"]
      },
      {
        title: "Qutub Minar Complex",
        state: "Mehrauli, New Delhi",
        tagline: "73-meter towering victory minaret crafted in fluted red sandstone",
        image: "https://images.unsplash.com/photo-1592635196078-9fe32a2608b6?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Iron Pillar of Delhi", "Ala'i Darwaza", "UNESCO World Heritage"]
      },
      {
        title: "Humayun's Tomb",
        state: "Nizamuddin, New Delhi",
        tagline: "Magnificent garden tomb that inspired the Taj Mahal",
        image: "https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Charbagh Gardens", "Double Dome Architecture", "Persian Symmetry"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-5012",
        departureTime: "08:00",
        arrivalTime: "10:15",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 4999,
        aircraft: "Airbus A321neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Frequent Flyer Favorite"
      },
      {
        airline: "Air India",
        flightNo: "AI-805",
        departureTime: "15:30",
        arrivalTime: "17:45",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 5400,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Free Hot Meal"
      }
    ],
    hotels: [
      {
        name: "The Imperial New Delhi",
        category: "Iconic Heritage 5-Star Hotel",
        location: "Janpath, Connaught Place",
        rating: 4.8,
        reviewsCount: 3890,
        pricePerNight: 19500,
        amenities: ["Heritage Art Galleries", "Spice Route Dining", "Outdoor Pool", "Spa & Wellness"],
        description: "Legendary 1930s colonial elegance walking distance from Connaught Place and India Gate."
      },
      {
        name: "The Leela Palace New Delhi",
        category: "Ultra-Luxury Palace Hotel",
        location: "Chanakyapuri Diplomatic Enclave",
        rating: 4.9,
        reviewsCount: 2950,
        pricePerNight: 24000,
        amenities: ["Rooftop Temperature-Controlled Pool", "Megu Japanese Restaurant", "ESPA Spa"],
        description: "Opulent architecture inspired by Lutyens' Delhi with lavish royal art collections."
      }
    ],
    restaurants: [
      {
        name: "Bukhara",
        cuisine: "North-West Frontier Tandoori",
        location: "ITC Maurya, Diplomatic Enclave",
        priceForTwo: 5500,
        rating: 4.8,
        reviewsCount: 4200,
        mustTry: ["Dal Bukhara (Simmered 18 hours)", "Sikandari Raan", "Jumbo Tandoori Naan"],
        ambience: "Rustic stone walls, open clay oven show kitchen, and world-renowned clay cooking."
      },
      {
        name: "Karim's Historic Mughlai",
        cuisine: "Old Delhi Mughlai & Kebabs",
        location: "Gali Kababian, Jama Masjid",
        priceForTwo: 900,
        rating: 4.5,
        reviewsCount: 6800,
        mustTry: ["Mutton Korma", "Seekh Kebabs", "Chicken Jahangiri", "Sheermal"],
        ambience: "Vintage 1913 establishment tucked in the bustling alleys of Shahjahanabad."
      }
    ],
    attractions: [
      {
        name: "Qutub Minar & Mehrauli Archaeological Park",
        category: "UNESCO World Heritage Site",
        location: "Mehrauli, New Delhi",
        timings: "07:00 AM - 07:00 PM",
        entryFee: "₹35 (Indians) · ₹550 (Foreigners)",
        highlights: "World's tallest brick minaret surrounded by early medieval Islamic monuments."
      },
      {
        name: "Humayun's Tomb & Sunder Nursery",
        category: "Mughal Heritage & Botanical Gardens",
        location: "Nizamuddin, New Delhi",
        timings: "06:00 AM - 06:00 PM",
        entryFee: "₹35 (Indians) · Free for under 15",
        highlights: "Pristine Persian water channels and newly restored 90-acre heritage ecological park."
      }
    ]
  },
  "Mumbai": {
    banners: [
      {
        title: "Gateway of India & Taj Mahal Palace",
        state: "Colaba, Mumbai",
        tagline: "Ceremonial arch overlooking Mumbai Harbour and the Arabian Sea",
        image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Colonial Basalt Arch", "Elephanta Island Ferry", "Sea Breeze Promenade"]
      },
      {
        title: "Marine Drive (Queen's Necklace)",
        state: "South Mumbai",
        tagline: "3.6-kilometer seaside promenade glittering under city night lights",
        image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Art Deco Buildings", "Chowpatty Beach", "Sunset Gathering Point"]
      },
      {
        title: "Bandra-Worli Sea Link",
        state: "Mumbai Coastal Road",
        tagline: "Spectacular 8-lane cable-stayed bridge spanning Mahim Bay",
        image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Modern Civil Engineering", "Arabian Sea Crossings", "Skyline Views"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-5338",
        departureTime: "07:00",
        arrivalTime: "09:10",
        duration: "2h 10m",
        stops: "Non-stop",
        price: 4750,
        aircraft: "Airbus A321neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Business Express"
      },
      {
        airline: "Air India",
        flightNo: "AI-678",
        departureTime: "13:30",
        arrivalTime: "15:40",
        duration: "2h 10m",
        stops: "Non-stop",
        price: 5200,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Meal Included"
      }
    ],
    hotels: [
      {
        name: "The Taj Mahal Palace, Mumbai",
        category: "Legendary 5-Star Grand Luxury",
        location: "Apollo Bunder, Colaba",
        rating: 4.9,
        reviewsCount: 5200,
        pricePerNight: 28000,
        amenities: ["Harbour Views", "Wasabi by Morimoto", "Sea Lounge Afternoon Tea", "Palace Spa"],
        description: "India's premier luxury heritage landmark opened in 1903, welcoming royalty and dignitaries."
      },
      {
        name: "Trident Hotel Nariman Point",
        category: "5-Star Seafront Business & Leisure",
        location: "Marine Drive, Nariman Point",
        rating: 4.7,
        reviewsCount: 3600,
        pricePerNight: 14500,
        amenities: ["Queen's Necklace View", "Outdoor Pool", "Frangipani Mediterranean Dining"],
        description: "Dramatic vistas over the sweeping Arabian Sea along the famous Marine Drive promenade."
      }
    ],
    restaurants: [
      {
        name: "Trishna",
        cuisine: "Mangalorean Coastal Seafood",
        location: "Kala Ghoda, Fort",
        priceForTwo: 2600,
        rating: 4.7,
        reviewsCount: 3200,
        mustTry: ["Butter Garlic Butter Crab", "Koliwada Prawns", "Neer Dosa", "Hyderabadi Fish"],
        ambience: "World-celebrated seafood institution famous for fresh catch and intense coastal garlic flavors."
      },
      {
        name: "Britannia & Co. Restaurant",
        cuisine: "Historic Parsi & Irani Cafe Cuisine",
        location: "Ballard Estate, Fort",
        priceForTwo: 950,
        rating: 4.5,
        reviewsCount: 4100,
        mustTry: ["Berry Pulao", "Mutton Dhansak with Brown Rice", "Sali Boti", "Caramel Custard"],
        ambience: "1923 colonial ceiling fans, bentwood chairs, and legendary Parsi culinary heritage."
      }
    ],
    attractions: [
      {
        name: "Gateway of India & Elephanta Caves",
        category: "Historical Landmark & Rock-cut Caves",
        location: "Apollo Bandar, Colaba",
        timings: "Open 24 Hours (Ferry: 09:00 AM - 05:30 PM)",
        entryFee: "₹40 (Elephanta Caves) + Ferry",
        highlights: "6th-century rock-cut Shiva sculptures located on an island in Mumbai Harbour."
      },
      {
        name: "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya (CSMVS)",
        category: "Art & History Museum",
        location: "Kala Ghoda, Fort",
        timings: "10:15 AM - 06:00 PM",
        entryFee: "₹150 (Indians) · Indo-Saracenic Gardens",
        highlights: "Over 50,000 artifacts across ancient Indian art, sculpture, and natural history."
      }
    ]
  },
  "Bengaluru": {
    banners: [
      {
        title: "Bangalore Palace",
        state: "Vasanth Nagar, Bengaluru",
        tagline: "Tudor-style royal estate with fortified towers and woodcarvings",
        image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Tudor Architecture", "Wodeyar Dynasty Art", "Sprawling Royal Grounds"]
      },
      {
        title: "Lalbagh Botanical Garden",
        state: "Mavalli, Bengaluru",
        tagline: "240-acre botanical haven with an iconic 19th-century Glass House",
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
        highlights: ["London Crystal Palace design", "Centuries-old Trees", "Lotus Pond"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-442",
        departureTime: "06:45",
        arrivalTime: "08:15",
        duration: "1h 30m",
        stops: "Non-stop",
        price: 3890,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "High Frequency"
      },
      {
        airline: "Akasa Air",
        flightNo: "QP-1120",
        departureTime: "12:15",
        arrivalTime: "13:45",
        duration: "1h 30m",
        stops: "Non-stop",
        price: 3450,
        aircraft: "Boeing 737 MAX",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Best Value"
      }
    ],
    hotels: [
      {
        name: "The Leela Palace Bengaluru",
        category: "5-Star Art & Garden Palace Hotel",
        location: "Old Airport Road, Kodihalli",
        rating: 4.9,
        reviewsCount: 3900,
        pricePerNight: 17500,
        amenities: ["Royal Gardens", "Citrus Restaurant", "Spa by ESPA", "Waterfall Courtyards"],
        description: "Palatial grandeur inspired by the royal palaces of Mysore, set amidst nine acres of greenery."
      },
      {
        name: "Taj West End, Bengaluru",
        category: "Historic 5-Star Heritage Garden Resort",
        location: "Racecourse Road",
        rating: 4.8,
        reviewsCount: 2800,
        pricePerNight: 15000,
        amenities: ["20 Acres of Flora", "Blue Ginger Vietnamese", "Heritage Tree Trails"],
        description: "Bengaluru's oldest hotel established in 1887, featuring tranquil colonial cottages and 150-year-old trees."
      }
    ],
    restaurants: [
      {
        name: "Vidyarthi Bhavan",
        cuisine: "Iconic South Indian Tiffin",
        location: "Gandhi Bazaar, Basavanagudi",
        priceForTwo: 350,
        rating: 4.6,
        reviewsCount: 8900,
        mustTry: ["Crisp Masala Dosa", "Filter Coffee", "Kesari Bath", "Idli Vada"],
        ambience: "Vintage 1943 eatery where waiters skillfully balance towers of sizzling ghee-drenched dosas."
      },
      {
        name: "Toit Brewpub",
        cuisine: "Microbrewery & Wood-Fired Pub Fare",
        location: "Indiranagar, 100 Feet Road",
        priceForTwo: 2000,
        rating: 4.7,
        reviewsCount: 12500,
        mustTry: ["Basmati Blonde Ale", "Tin Man Stout", "Tart Flambee Pizza", "Loaded Nachos"],
        ambience: "Lively multi-level craft beer temple synonymous with Bengaluru's pub culture."
      }
    ],
    attractions: [
      {
        name: "Lalbagh Glass House & Botanical Gardens",
        category: "Botanical Heritage & Nature",
        location: "Mavalli, Bengaluru",
        timings: "06:00 AM - 07:00 PM",
        entryFee: "₹25 (Adults)",
        highlights: "Historical garden commissioned by Hyder Ali, housing over 1,800 exotic species of flora."
      },
      {
        name: "Tipu Sultan's Summer Palace & Bangalore Fort",
        category: "Historic Wooden Palace",
        location: "Chamrajpet, Bengaluru",
        timings: "08:30 AM - 05:30 PM",
        entryFee: "₹20 (Indians)",
        highlights: "Exquisite teakwood pillars, arches, and balconies adorned with floral motifs."
      }
    ]
  },
  "Kochi": {
    banners: [
      {
        title: "Chinese Fishing Nets, Fort Kochi",
        state: "Kochi, Kerala",
        tagline: "Iconic cantilevered shore nets silhouetted against the sunset",
        image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
        highlights: ["14th-Century Fishing Heritage", "Harbour Breeze", "Sunset Pier"]
      },
      {
        title: "Mattancherry & Jew Town",
        state: "Old Kochi, Kerala",
        tagline: "Colonial spice warehouses, antique shops, and the Paradesi Synagogue",
        image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Spice Markets", "Antique Clocks", "Jewish Synagogue"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-518",
        departureTime: "07:30",
        arrivalTime: "09:40",
        duration: "2h 10m",
        stops: "Non-stop",
        price: 4320,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Daily Non-Stop"
      },
      {
        airline: "Air India Express",
        flightNo: "IX-431",
        departureTime: "15:00",
        arrivalTime: "17:15",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 3950,
        aircraft: "Boeing 737-800",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Great Value"
      }
    ],
    hotels: [
      {
        name: "Brunton Boatyard (CGH Earth)",
        category: "Colonial Harbour Heritage Hotel",
        location: "Fort Kochi Harbour Pier",
        rating: 4.8,
        reviewsCount: 1980,
        pricePerNight: 16000,
        amenities: ["Harbour-view Pool", "Ayurvedic Centre", "History & Spice Cuisine", "Sunset Boat Cruise"],
        description: "Re-creation of a 19th-century Victorian shipyard directly overlooking the Cochin harbour entrance."
      },
      {
        name: "Forte Kochi",
        category: "Boutique Heritage Mansion",
        location: "Princess Street, Fort Kochi",
        rating: 4.7,
        reviewsCount: 1100,
        pricePerNight: 8500,
        amenities: ["Central Courtyard Pool", "Original Portuguese Tiles", "Cochin Club Proximity"],
        description: "Exquisite 27-room boutique jewel dating back to the Dutch and British colonial eras."
      }
    ],
    restaurants: [
      {
        name: "Kashi Art Cafe",
        cuisine: "Continental, Cafe, & Fresh Bakes",
        location: "Burgher Street, Fort Kochi",
        priceForTwo: 900,
        rating: 4.6,
        reviewsCount: 2700,
        mustTry: ["Warm Chocolate Cake", "French Toast", "Fresh Mint Lime", "Spinach Mushroom Omelette"],
        ambience: "Open-air art gallery cafe shaded by trees with contemporary art installations."
      },
      {
        name: "Dhe Puttu",
        cuisine: "Authentic Kerala Puttu & Seafood Curries",
        location: "Edappally, Kochi",
        priceForTwo: 800,
        rating: 4.5,
        reviewsCount: 4300,
        mustTry: ["Erachi Puttu (Spiced Beef)", "Prawn Roast Puttu", "Kadala Curry", "Sulaimani Chai"],
        ambience: "Celebratory restaurant dedicated to Kerala's beloved steamed rice cake delicacy."
      }
    ],
    attractions: [
      {
        name: "Fort Kochi Walking Trail & St. Francis Church",
        category: "Historic Walking Promenade",
        location: "Fort Kochi Pier",
        timings: "08:00 AM - 06:00 PM",
        entryFee: "Free Entry",
        highlights: "India's oldest European church where explorer Vasco da Gama was initially buried in 1524."
      },
      {
        name: "Mattancherry Dutch Palace & Jewish Synagogue",
        category: "Historic Palace & Paradesi Synagogue",
        location: "Mattancherry, Jew Town",
        timings: "10:00 AM - 05:00 PM",
        entryFee: "₹10 (Palace) · Hand-painted Chinese tiles in Synagogue",
        highlights: "Intricate Hindu mythological murals and 16th-century copper plate charters."
      }
    ]
  }
};

// Generic fallback generator for cities not explicitly predefined
export function getDestinationData(cityName) {
  if (!cityName) {
    return {
      banners: DEFAULT_INDIA_BANNERS,
      flights: [
        {
          airline: "IndiGo",
          flightNo: "6E-720",
          departureTime: "06:30",
          arrivalTime: "08:45",
          duration: "2h 15m",
          stops: "Non-stop",
          price: 4890,
          aircraft: "Airbus A320neo",
          baggage: "7kg Cabin · 15kg Check-in",
          status: "Top Value"
        },
        {
          airline: "Air India",
          flightNo: "AI-440",
          departureTime: "14:15",
          arrivalTime: "16:30",
          duration: "2h 15m",
          stops: "Non-stop",
          price: 5450,
          aircraft: "Airbus A321neo",
          baggage: "7kg Cabin · 15kg Check-in",
          status: "Complimentary Meal"
        },
        {
          airline: "Akasa Air",
          flightNo: "QP-128",
          departureTime: "18:00",
          arrivalTime: "20:15",
          duration: "2h 15m",
          stops: "Non-stop",
          price: 4300,
          aircraft: "Boeing 737 MAX",
          baggage: "7kg Cabin · 15kg Check-in",
          status: "Economical"
        }
      ],
      hotels: [
        {
          name: "Premium City Center Hotel",
          category: "4-Star Modern Hotel",
          location: "Central Business District",
          rating: 4.5,
          reviewsCount: 1420,
          pricePerNight: 4500,
          amenities: ["Free Wi-Fi", "Buffet Breakfast", "Fitness Center", "Airport Shuttle"],
          description: "Comfortable and convenient location close to key shopping hubs and transit."
        },
        {
          name: "Heritage Grand Residency",
          category: "Heritage Boutique Stay",
          location: "Historic Quarter",
          rating: 4.6,
          reviewsCount: 980,
          pricePerNight: 6200,
          amenities: ["Courtyard Dining", "Free Wi-Fi", "Cultural Evenings", "Swimming Pool"],
          description: "Authentic regional architecture blended with contemporary hospitality."
        }
      ],
      restaurants: [
        {
          name: "Royal Heritage Dining",
          cuisine: "North Indian & Regional Specialties",
          location: "City Center",
          priceForTwo: 1200,
          rating: 4.6,
          reviewsCount: 1650,
          mustTry: ["Signature Thali", "Slow-cooked Curries", "Artisan Breads", "Kulfi"],
          ambience: "Traditional setting with regional music and authentic hospitality."
        },
        {
          name: "The Coastal Kitchen",
          cuisine: "Coastal & Tandoori Favorites",
          location: "Main Market",
          priceForTwo: 1400,
          rating: 4.5,
          reviewsCount: 1240,
          mustTry: ["Fresh Catch Fry", "Biryani", "Spiced Mocktails"],
          ambience: "Lively family restaurant celebrated for fresh ingredients and rich aromas."
        }
      ],
      attractions: [
        {
          name: "Historic Fort & Museum",
          category: "Heritage Landmark",
          location: "Old City Quarter",
          timings: "09:00 AM - 05:00 PM",
          entryFee: "₹30 (Indians)",
          highlights: "Ancient architecture, royal artifacts, and panoramic views over the city."
        },
        {
          name: "City Promenade & Central Bazaars",
          category: "Culture & Shopping",
          location: "City Commercial Center",
          timings: "10:00 AM - 08:30 PM",
          entryFee: "Free Entry",
          highlights: "Vibrant handicrafts, textiles, street delicacies, and evening atmosphere."
        }
      ]
    };
  }

  // Exact or partial match check
  const cleanCity = cityName.split(" (")[0].trim();
  for (const [key, val] of Object.entries(DESTINATION_DETAILS)) {
    if (cleanCity.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cleanCity.toLowerCase())) {
      return val;
    }
  }

  // If specific city is not matched, return a customized template with city's name
  return {
    banners: [
      {
        title: `Explore ${cleanCity}`,
        state: "India",
        tagline: `Discover the scenic wonders, culture, and cuisine of ${cleanCity}`,
        image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Iconic Landmarks", "Regional Cuisine", "Local Markets"]
      },
      {
        title: `${cleanCity} Heritage & Sights`,
        state: "India",
        tagline: `Unforgettable memories and panoramic views in ${cleanCity}`,
        image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
        highlights: ["Architectural Gems", "Cultural Trails", "Sunset Points"]
      }
    ],
    flights: [
      {
        airline: "IndiGo",
        flightNo: "6E-512",
        departureTime: "07:15",
        arrivalTime: "09:30",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 4950,
        aircraft: "Airbus A320neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Best Connection"
      },
      {
        airline: "Air India",
        flightNo: "AI-645",
        departureTime: "13:40",
        arrivalTime: "15:55",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 5600,
        aircraft: "Airbus A321neo",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Complimentary Refreshments"
      },
      {
        airline: "Akasa Air",
        flightNo: "QP-1402",
        departureTime: "18:20",
        arrivalTime: "20:35",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 4420,
        aircraft: "Boeing 737 MAX",
        baggage: "7kg Cabin · 15kg Check-in",
        status: "Affordable Fares"
      }
    ],
    hotels: [
      {
        name: `${cleanCity} Grand Palace Hotel`,
        category: "4-Star Luxury City Hotel",
        location: `Central ${cleanCity}`,
        rating: 4.6,
        reviewsCount: 1650,
        pricePerNight: 5200,
        amenities: ["Free High-speed Wi-Fi", "Swimming Pool", "Multi-cuisine Restaurant", "Airport Cab Service"],
        description: `Premier hotel located in the heart of ${cleanCity} offering deluxe rooms and warm regional hospitality.`
      },
      {
        name: `The Heritage Residency ${cleanCity}`,
        category: "Boutique Heritage Hotel",
        location: `Old Town, ${cleanCity}`,
        rating: 4.5,
        reviewsCount: 890,
        pricePerNight: 3900,
        amenities: ["Rooftop Restaurant", "Free Breakfast", "Travel Desk", "Air Conditioning"],
        description: `Charming traditional ambiance with quick access to ${cleanCity}'s principal landmarks.`
      }
    ],
    restaurants: [
      {
        name: `${cleanCity} Royal Thali House`,
        cuisine: "Authentic Regional Cuisine & Thalis",
        location: "City Commercial Center",
        priceForTwo: 950,
        rating: 4.6,
        reviewsCount: 1420,
        mustTry: ["Special Deluxe Thali", "Local Spiced Curries", "Artisan Sweets"],
        ambience: "Traditional family dining with authentic regional flavors and fast service."
      },
      {
        name: "Flavors of India Bistro",
        cuisine: "North & South Indian Specialties",
        location: "Mall Road / Station Road",
        priceForTwo: 1100,
        rating: 4.4,
        reviewsCount: 980,
        mustTry: ["Tandoori Platters", "Paneer Tikka", "Biryani Pot"],
        ambience: "Contemporary, air-conditioned dining perfect for family and group meals."
      }
    ],
    attractions: [
      {
        name: `${cleanCity} Historic Fort & Museum`,
        category: "Historic Landmark",
        location: `Heritage Zone, ${cleanCity}`,
        timings: "09:00 AM - 05:30 PM",
        entryFee: "₹30 (Indians)",
        highlights: `Significant historical artifacts and panoramic views of ${cleanCity}.`
      },
      {
        name: `${cleanCity} Promenade & Traditional Bazaar`,
        category: "Culture, Street Food & Shopping",
        location: `Central ${cleanCity}`,
        timings: "10:00 AM - 09:00 PM",
        entryFee: "Free Entry",
        highlights: "Local handicrafts, street snacks, and lively regional atmosphere."
      }
    ]
  };
}
