/**
 * API Route: Real-Time AI Companion Chat Handler
 * Handles multi-turn chat turns with input sanitization and security guardrails.
 * 
 * @module /api/ai/chat
 */

import { NextResponse } from 'next/server';
import { generateCompanionResponse } from '@/lib/gemini';

/**
 * Handle POST request for AI companion interaction
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, userContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs — strip HTML/script tags to prevent prompt injection
    const sanitizedMessages = messages.map((m) => ({
      role: String(m.role || 'user').toLowerCase() === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '')
        .replace(/<[^>]*>/g, '')
        .slice(0, 2000),
    }));

    const response = await generateCompanionResponse(
      sanitizedMessages,
      userContext || {}
    );

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}
