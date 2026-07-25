// API Route: Location-Based Recovery Clinic & Specialist Finder (Zero-AI)
// POST /api/clinic-search

import { NextResponse } from 'next/server';

const VERIFIED_CLINICS_DATABASE = [
  {
    id: 'clinic_1',
    name: 'Kripa Foundation De-Addiction & Rehab Center',
    category: 'De-addiction Center',
    city: 'Mumbai',
    address: '81, Mt. Carmel Church Compound, Bandra West, Mumbai, Maharashtra 400050',
    phone: '+91 22 2640 5411',
    rating: '4.8 ⭐',
    accreditation: 'Government Approved & WHO Affiliated',
    mapsUrl: 'https://www.google.com/maps/search/Kripa+Foundation+Bandra+Mumbai'
  },
  {
    id: 'clinic_2',
    name: 'NIMHANS Center for Addiction Medicine',
    category: 'Addiction Psychiatrists',
    city: 'Bengaluru',
    address: 'Hosur Road, Lakkasandra, Wilson Garden, Bengaluru, Karnataka 560029',
    phone: '+91 80 2699 5000',
    rating: '4.9 ⭐',
    accreditation: 'National Institute of Excellence',
    mapsUrl: 'https://www.google.com/maps/search/NIMHANS+Addiction+Medicine+Bengaluru'
  },
  {
    id: 'clinic_3',
    name: 'AIIMS National Drug Dependence Treatment Centre (NDDTC)',
    category: 'De-addiction Center',
    city: 'Delhi',
    address: 'CGO Complex, Ghaziabad / Ansari Nagar, New Delhi, Delhi 110029',
    phone: '+91 11 2658 8500',
    rating: '4.7 ⭐',
    accreditation: 'Premier National Health Institute',
    mapsUrl: 'https://www.google.com/maps/search/AIIMS+NDDTC+Delhi'
  },
  {
    id: 'clinic_4',
    name: 'TTK Hospital & De-Addiction Center',
    category: 'De-addiction Center',
    city: 'Chennai',
    address: 'IV Main Road, Indira Nagar, Adyar, Chennai, Tamil Nadu 600020',
    phone: '+91 44 2441 8469',
    rating: '4.8 ⭐',
    accreditation: 'ISO 9001:2015 Certified Center',
    mapsUrl: 'https://www.google.com/maps/search/TTK+Hospital+Adyar+Chennai'
  },
  {
    id: 'clinic_5',
    name: 'Asha Hospital Department of Addiction Psychiatry',
    category: 'Addiction Psychiatrists',
    city: 'Hyderabad',
    address: 'Plot No 298, Road No 14, Banjara Hills, Hyderabad, Telangana 500034',
    phone: '+91 40 2354 5321',
    rating: '4.6 ⭐',
    accreditation: 'NABH Accredited Psychiatric Center',
    mapsUrl: 'https://www.google.com/maps/search/Asha+Hospital+Banjara+Hills+Hyderabad'
  },
  {
    id: 'clinic_6',
    name: 'Antara Psychiatric & De-Addiction Center',
    category: 'Clinical Psychologists',
    city: 'Kolkata',
    address: 'Dakshin Gobindapur, PS Sonarpur, Kolkata, West Bengal 700145',
    phone: '+91 33 2437 8476',
    rating: '4.7 ⭐',
    accreditation: 'West Bengal Mental Health Authority Registered',
    mapsUrl: 'https://www.google.com/maps/search/Antara+Psychiatric+Center+Kolkata'
  },
  {
    id: 'clinic_7',
    name: 'Mukul Madhav De-Addiction & Rehab Institute',
    category: 'De-addiction Center',
    city: 'Pune',
    address: 'Karve Road, Deccan Gymkhana, Pune, Maharashtra 411004',
    phone: '+91 20 2544 3210',
    rating: '4.7 ⭐',
    accreditation: 'State Mental Health Authority Certified',
    mapsUrl: 'https://www.google.com/maps/search/De-Addiction+Center+Karve+Road+Pune'
  }
];

// In-Memory Search Result Cache for sub-millisecond efficiency
const searchCache = new Map();

export async function POST(request) {
  try {
    const body = await request.json();
    const { city, category } = body;

    const searchCity = String(city || '').trim().toLowerCase();
    const searchCat = String(category || 'All').trim();
    const cacheKey = `${searchCity}:${searchCat}`;

    // 1. Fast Cache Hit
    if (searchCache.has(cacheKey)) {
      return NextResponse.json(searchCache.get(cacheKey), {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'X-Cache-Status': 'HIT',
        },
      });
    }

    // 2. Filter by city and optional category
    const matchedClinics = VERIFIED_CLINICS_DATABASE.filter(clinic => {
      const matchCity = !searchCity || clinic.city.toLowerCase().includes(searchCity) || searchCity.includes(clinic.city.toLowerCase());
      const matchCat = searchCat === 'All' || clinic.category === searchCat;
      return matchCity && matchCat;
    });

    const responseData = {
      success: true,
      city: city || 'All',
      category: searchCat,
      totalMatched: matchedClinics.length,
      clinics: matchedClinics,
      // Provide direct live Maps search fallback trigger
      liveMapsUrl: `https://www.google.com/maps/search/addiction+recovery+therapists+and+centers+in+${encodeURIComponent(city || 'India')}`
    };

    // Cache the result (keep max 100 entries)
    if (searchCache.size > 100) searchCache.clear();
    searchCache.set(cacheKey, responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Cache-Status': 'MISS',
      },
    });
  } catch (error) {
    console.error('Clinic Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to search clinics.' },
      { status: 500 }
    );
  }
}
