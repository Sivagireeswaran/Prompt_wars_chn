// API Route: Non-Verbal Camera Input Interpreter
// POST /api/ai/vision-interpret
// Real Gemini 2.0 Flash Vision API call — no hardcoded mocks

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(request) {
  try {
    const body = await request.json();
    const { image } = body; // Base64 image data string

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Strip out base64 headers if present (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are an accessibility assistant for a substance use recovery companion app.
The user is non-verbal, deaf, or in acute crisis, and is presenting a visual cue to the camera.

Analyze this snapshot to:
1. Detect and read any written words, symbols, or drawings on a note card or piece of paper (e.g., "help", "anxious", "craving", "sad").
2. Detect and interpret any hand gestures or sign language gestures (e.g., thumbs-up meaning "I am okay" or "Ready", waving meaning "Hello", crossing arms, pointing, or basic signs representing feelings).

Return a single concise English word or a very short phrase (maximum 4 words) representing the user's input (e.g. "I need help", "Craving support", "Hello", "Feeling anxious").
If there is no readable card and no visible hand gesture in the frame, return exactly: "unclear".

Do not return any other text, explanation, or code fences — return only the raw English text.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg'
        }
      },
      prompt
    ]);

    const responseText = result.response.text().trim();
    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.warn('Vision Interpret API error (graceful fallback):', error.message);
    // Return 'unclear' instead of a 500 — the UI will show the quick-tap fallback grid
    // which gives the user working options even when the vision AI is unavailable
    return NextResponse.json({ text: 'unclear' });
  }
}

