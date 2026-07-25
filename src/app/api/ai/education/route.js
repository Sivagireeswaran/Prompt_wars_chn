// API Route: Educational Content Generation
// POST /api/ai/education
// Real Gemini API call — no mocks

import { NextResponse } from 'next/server';
import { generateEducationalContent } from '@/lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { topic, stage } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Sanitize topic input
    const sanitizedTopic = topic.replace(/<[^>]*>/g, '').slice(0, 200);

    const content = await generateEducationalContent(
      sanitizedTopic,
      stage || 'general'
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Education API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate educational content. Please try again.' },
      { status: 500 }
    );
  }
}
