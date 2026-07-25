/**
 * API Route: Learn & Grow AI Education Article Generator
 * Generates stage-aware evidence-based recovery articles with HTML sanitization.
 * 
 * @module /api/ai/education
 */

import { NextResponse } from 'next/server';
import { generateEducationalContent } from '@/lib/gemini';

/**
 * Handle POST request for educational content generation
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { topic, stage } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Sanitize topic input
    const sanitizedTopic = topic.replace(/<[^>]*>/g, '').slice(0, 200);

    const content = await generateEducationalContent(
      sanitizedTopic,
      stage || 'general'
    );

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error('Education API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate educational content. Please try again.' },
      { status: 500 }
    );
  }
}
