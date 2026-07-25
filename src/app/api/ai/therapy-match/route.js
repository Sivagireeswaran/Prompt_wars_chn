// API Route: Therapist Match Compatibility Redirect
// POST /api/ai/therapy-match -> Redirects to zero-AI /api/clinic-search

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const city = body?.assessment?.city || body?.city || '';
    
    // Redirect to zero-AI clinic search
    const searchRes = await fetch(new URL('/api/clinic-search', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, category: 'All' })
    });

    const data = await searchRes.json();
    return NextResponse.json({ matches: data.clinics, liveMapsUrl: data.liveMapsUrl });
  } catch (err) {
    return NextResponse.json({ matches: [], liveMapsUrl: 'https://www.google.com/maps/search/addiction+recovery+therapists' });
  }
}
