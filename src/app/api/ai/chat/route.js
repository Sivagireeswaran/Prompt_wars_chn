// API Route: AI Companion Chat
// POST /api/ai/chat
// Real Gemini API call — no mocks

import { NextResponse } from 'next/server';
import { generateCompanionResponse } from '@/lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, userContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs — strip HTML/script tags to prevent prompt injection
    const sanitizedMessages = messages.map((m) => ({
      role: m.role,
      content: String(m.content)
        .replace(/<[^>]*>/g, '')
        .slice(0, 2000), // Limit message length
    }));

    const response = await generateCompanionResponse(
      sanitizedMessages,
      userContext || {}
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}
