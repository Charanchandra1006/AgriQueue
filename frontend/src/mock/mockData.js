// Mock data for AgriQueue application
// NOTE: This mandi dataset is DEMO / OFFLINE data for testing and local demonstration.
// These values are not live government data.
export const nearbyMandis = [
  {
    id: 1,
    fallbackDistance: "4.2 km",
    external: {
      name: "Patiala Grain Market - Gate 2",
      state: "Punjab",
      district: "Patiala",
      location: "Patiala City Bypass Road",
      coordinates: {
        latitude: 30.3398,
        longitude: 76.3869
      },
      operatingHours: {
        openingTime: "08:00 AM",
        closingTime: "06:00 PM"
      },
      commodities: ["Paddy", "Wheat", "Maize"],
      marketPrices: [
        { commodity: "Paddy (Basmati)", variety: "1121", price: "₹3,850", unit: "quintal" },
        { commodity: "Wheat", variety: "Kalyan Sona", price: "₹2,425", unit: "quintal" },
        { commodity: "Maize", variety: "Hybrid", price: "₹2,150", unit: "quintal" }
      ],
      arrivals: "14,500 quintals",
      lastUpdated: "2026-08-30T17:00:00Z"
    },
    agriQueue: {
      availableSlots: 8,
      nextAvailableSlot: "Today, 11:30 AM",
      farmersAhead: 14,
      averageServiceTime: 15, // in minutes
      estimatedWaitingTime: 210, // calculated as farmersAhead * averageServiceTime
      crowdLevel: "Medium"
    }
  },
  {
    id: 2,
    fallbackDistance: "8.5 km",
    external: {
      name: "Sanaur Procurement Sub-Center",
      state: "Punjab",
      district: "Patiala",
      location: "Sanaur Road, Near Old Toll",
      coordinates: {
        latitude: 30.3015,
        longitude: 76.4312
      },
      operatingHours: {
        openingTime: "09:00 AM",
        closingTime: "05:00 PM"
      },
      commodities: ["Paddy", "Wheat"],
      marketPrices: [
        { commodity: "Paddy (Basmati)", variety: "1121", price: "₹3,800", unit: "quintal" },
        { commodity: "Wheat", variety: "Kalyan Sona", price: "₹2,400", unit: "quintal" }
      ],
      arrivals: "8,200 quintals",
      lastUpdated: "2026-08-30T16:30:00Z"
    },
    agriQueue: {
      availableSlots: 18,
      nextAvailableSlot: "Today, 09:30 AM",
      farmersAhead: 2,
      averageServiceTime: 15,
      estimatedWaitingTime: 30,
      crowdLevel: "Low"
    }
  },
  {
    id: 3,
    fallbackDistance: "24.0 km",
    external: {
      name: "Nabha Grain Market Yard",
      state: "Punjab",
      district: "Patiala",
      location: "Nabha Bypass, Near Grain Yard",
      coordinates: {
        latitude: 30.3705,
        longitude: 76.1511
      },
      operatingHours: {
        openingTime: "08:00 AM",
        closingTime: "07:00 PM"
      },
      commodities: ["Paddy", "Wheat", "Barley", "Mustard"],
      marketPrices: [
        { commodity: "Paddy (Basmati)", variety: "1121", price: "₹3,900", unit: "quintal" },
        { commodity: "Wheat", variety: "Kalyan Sona", price: "₹2,450", unit: "quintal" },
        { commodity: "Barley", variety: "Regular", price: "₹2,200", unit: "quintal" },
        { commodity: "Mustard Seeds", variety: "Pusa Bold", price: "₹5,650", unit: "quintal" }
      ],
      arrivals: "22,100 quintals",
      lastUpdated: "2026-08-30T17:15:00Z"
    },
    agriQueue: {
      availableSlots: 0,
      nextAvailableSlot: "Tomorrow, 08:30 AM",
      farmersAhead: 35,
      averageServiceTime: 12,
      estimatedWaitingTime: 420,
      crowdLevel: "High"
    }
  },
  {
    id: 4,
    fallbackDistance: "58.4 km",
    external: {
      name: "Ludhiana New Grain Market",
      state: "Punjab",
      district: "Ludhiana",
      location: "GT Road, Near Gill Bypass",
      coordinates: {
        latitude: 30.9010,
        longitude: 75.8573
      },
      operatingHours: {
        openingTime: "07:30 AM",
        closingTime: "06:30 PM"
      },
      commodities: ["Paddy", "Wheat", "Maize", "Sunflower"],
      marketPrices: [
        { commodity: "Paddy (Basmati)", variety: "1509", price: "₹3,780", unit: "quintal" },
        { commodity: "Wheat", variety: "HD 2967", price: "₹2,440", unit: "quintal" },
        { commodity: "Maize", variety: "African Tall", price: "₹2,180", unit: "quintal" }
      ],
      arrivals: "31,400 quintals",
      lastUpdated: "2026-08-30T17:20:00Z"
    },
    agriQueue: {
      availableSlots: 14,
      nextAvailableSlot: "Today, 02:00 PM",
      farmersAhead: 8,
      averageServiceTime: 12,
      estimatedWaitingTime: 96,
      crowdLevel: "Medium"
    }
  },
  {
    id: 5,
    fallbackDistance: "142.0 km",
    external: {
      name: "Bathinda Cotton & Grain Yard",
      state: "Punjab",
      district: "Bathinda",
      location: "Mansa Road, Industrial Area Phase-1",
      coordinates: {
        latitude: 30.2110,
        longitude: 74.9455
      },
      operatingHours: {
        openingTime: "08:00 AM",
        closingTime: "05:30 PM"
      },
      commodities: ["Cotton", "Paddy", "Wheat", "Mustard"],
      marketPrices: [
        { commodity: "Cotton (Long Staple)", variety: "Bt-2", price: "₹7,100", unit: "quintal" },
        { commodity: "Paddy (PR 126)", variety: "Common", price: "₹2,320", unit: "quintal" },
        { commodity: "Mustard Seeds", variety: "Pusa Bold", price: "₹5,620", unit: "quintal" }
      ],
      arrivals: "19,800 quintals",
      lastUpdated: "2026-08-30T16:50:00Z"
    },
    agriQueue: {
      availableSlots: 6,
      nextAvailableSlot: "Today, 03:30 PM",
      farmersAhead: 19,
      averageServiceTime: 14,
      estimatedWaitingTime: 266,
      crowdLevel: "High"
    }
  },
  {
    id: 6,
    fallbackDistance: "98.2 km",
    external: {
      name: "Karnal Anaj Mandi Complex",
      state: "Haryana",
      district: "Karnal",
      location: "Kunjpura Road, Near Sector 3",
      coordinates: {
        latitude: 29.6857,
        longitude: 76.9905
      },
      operatingHours: {
        openingTime: "08:30 AM",
        closingTime: "06:00 PM"
      },
      commodities: ["Paddy", "Wheat", "Basmati", "Barley"],
      marketPrices: [
        { commodity: "Paddy (Basmati)", variety: "Super 1121", price: "₹3,950", unit: "quintal" },
        { commodity: "Wheat", variety: "WH 1105", price: "₹2,460", unit: "quintal" }
      ],
      arrivals: "26,500 quintals",
      lastUpdated: "2026-08-30T17:30:00Z"
    },
    agriQueue: {
      availableSlots: 22,
      nextAvailableSlot: "Today, 10:45 AM",
      farmersAhead: 3,
      averageServiceTime: 10,
      estimatedWaitingTime: 30,
      crowdLevel: "Low"
    }
  },
  {
    id: 7,
    fallbackDistance: "52.0 km",
    external: {
      name: "Ambala City Grain Market",
      state: "Haryana",
      district: "Ambala",
      location: "Old Delhi Road, Near Railway Station",
      coordinates: {
        latitude: 30.3782,
        longitude: 76.7767
      },
      operatingHours: {
        openingTime: "08:00 AM",
        closingTime: "06:00 PM"
      },
      commodities: ["Paddy", "Wheat", "Mustard"],
      marketPrices: [
        { commodity: "Paddy (Basmati)", variety: "1121", price: "₹3,820", unit: "quintal" },
        { commodity: "Wheat", variety: "Sharbati", price: "₹2,500", unit: "quintal" },
        { commodity: "Mustard Seeds", variety: "RH 30", price: "₹5,700", unit: "quintal" }
      ],
      arrivals: "16,200 quintals",
      lastUpdated: "2026-08-30T17:05:00Z"
    },
    agriQueue: {
      availableSlots: 11,
      nextAvailableSlot: "Today, 01:15 PM",
      farmersAhead: 7,
      averageServiceTime: 12,
      estimatedWaitingTime: 84,
      crowdLevel: "Medium"
    }
  },
  {
    id: 8,
    fallbackDistance: "310.0 km",
    external: {
      name: "Jaipur Muhana Krishi Upaj Mandi",
      state: "Rajasthan",
      district: "Jaipur",
      location: "Muhana Terminal Market, Sanganer",
      coordinates: {
        latitude: 26.7825,
        longitude: 75.7610
      },
      operatingHours: {
        openingTime: "07:00 AM",
        closingTime: "07:00 PM"
      },
      commodities: ["Mustard", "Wheat", "Barley", "Gram"],
      marketPrices: [
        { commodity: "Mustard Seeds", variety: "Giriraj", price: "₹5,800", unit: "quintal" },
        { commodity: "Wheat", variety: "Raj 4037", price: "₹2,480", unit: "quintal" },
        { commodity: "Gram (Chana)", variety: "Desi", price: "₹5,200", unit: "quintal" }
      ],
      arrivals: "38,000 quintals",
      lastUpdated: "2026-08-30T17:40:00Z"
    },
    agriQueue: {
      availableSlots: 15,
      nextAvailableSlot: "Today, 11:00 AM",
      farmersAhead: 12,
      averageServiceTime: 15,
      estimatedWaitingTime: 180,
      crowdLevel: "Medium"
    }
  }
];

export const cropPrices = [
  {
    id: 1,
    crop: "Paddy (Basmati)",
    price: "₹3,850",
    unit: "quintal",
    change: "+₹120",
    isUp: true,
    mandi: "Patiala Market"
  },
  {
    id: 2,
    crop: "Wheat (Kalyan)",
    price: "₹2,425",
    unit: "quintal",
    change: "+₹15",
    isUp: true,
    mandi: "Sanaur Market"
  },
  {
    id: 3,
    crop: "Cotton (Long Staple)",
    price: "₹7,100",
    unit: "quintal",
    change: "-₹80",
    isUp: false,
    mandi: "Bathinda Market"
  },
  {
    id: 4,
    crop: "Mustard Seeds",
    price: "₹5,650",
    unit: "quintal",
    change: "+₹45",
    isUp: true,
    mandi: "Nabha Market"
  }
];

export const weatherAlerts = {
  currentTemp: "31°C",
  condition: "Partly Cloudy",
  humidity: "74%",
  windSpeed: "12 km/h",
  alerts: [
    {
      id: 1,
      severity: "Warning",
      message: "Thunderstorms & light rain expected tomorrow afternoon. Protect open grain heaps."
    }
  ],
  forecast: [
    { day: "Today", temp: "32°", icon: "cloud-sun", label: "Partly Cloudy" },
    { day: "Tomorrow", temp: "29°", icon: "cloud-rain", label: "Rainy" },
    { day: "Sat", temp: "30°", icon: "cloud-showers-heavy", label: "Showers" },
    { day: "Sun", temp: "33°", icon: "sun", label: "Sunny" }
  ]
};

export const agriReels = [
  {
    id: 1,
    title: "How to prevent Paddy Stem Borer infestation",
    duration: "2:45",
    views: "12.4K views",
    category: "Crop Protection",
    thumbnail: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&h=250&fit=crop"
  },
  {
    id: 2,
    title: "Understanding Soil Health Card Recommendations",
    duration: "1:30",
    views: "8.9K views",
    category: "Soil & Fertilizer",
    thumbnail: "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=400&h=250&fit=crop"
  },
  {
    id: 3,
    title: "Organic Liquid Fertilizer (Jeevamrutha) Preparation",
    duration: "3:15",
    views: "24.1K views",
    category: "Organic Farming",
    thumbnail: "https://images.unsplash.com/photo-1563514223741-24b99e8e4130?w=400&h=250&fit=crop"
  }
];

export const impactStats = [
  {
    id: 1,
    label: "Registered Farmers",
    value: "142,500+",
    desc: "Active users nationwide"
  },
  {
    id: 2,
    label: "Average Wait Reduced",
    value: "68%",
    desc: "From 6 hours to ~1.8 hours"
  },
  {
    id: 3,
    label: "Transactions Facilitated",
    value: "₹428 Crore",
    desc: "Direct-to-bank procurement"
  }
];
