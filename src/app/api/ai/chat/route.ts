/**
 * AI Chat API Endpoint
 * Handles chatbot conversations using Google Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, ChatMessage, getQuickSuggestions } from '@/lib/ai/gemini-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate conversation history
    const history: ChatMessage[] = Array.isArray(conversationHistory) 
      ? conversationHistory 
      : [];

    // Send message to AI
    const response = await sendChatMessage(message, history);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'AI service error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: response.message,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return quick suggestions
  return NextResponse.json({
    suggestions: getQuickSuggestions(),
    success: true
  });
}
