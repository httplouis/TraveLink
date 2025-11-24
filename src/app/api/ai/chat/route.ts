/**
 * AI Chat API Endpoint
 * Handles chatbot conversations using Google Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, ChatMessage, getQuickSuggestions } from '@/lib/ai/gemini-service';

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/ai/chat] Request received');
    const body = await request.json();
    const { message, conversationHistory } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      console.log('[POST /api/ai/chat] Invalid message');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate conversation history
    const history: ChatMessage[] = Array.isArray(conversationHistory) 
      ? conversationHistory 
      : [];

    console.log('[POST /api/ai/chat] Sending message to AI service');
    const startTime = Date.now();

    // Send message to AI with timeout
    const response = await sendChatMessage(message, history);

    const duration = Date.now() - startTime;
    console.log(`[POST /api/ai/chat] AI response received in ${duration}ms`);

    if (!response.success) {
      // Use 503 (Service Unavailable) for missing API key or configuration issues
      // This is more appropriate than 500 (Internal Server Error)
      const isConfigError = response.error === 'Missing API key' || response.error?.includes('API key');
      const statusCode = isConfigError ? 503 : 500;
      
      // Only log unexpected errors, not missing API key (expected in some deployments)
      if (!isConfigError) {
        console.error('[POST /api/ai/chat] AI service error:', response.error);
      }
      
      return NextResponse.json(
        { 
          error: response.error || 'AI service error',
          message: response.message || 'Unable to connect to the AI service. Please check your connection and try again.',
          success: false
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      message: response.message,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (error) {
    console.error('[POST /api/ai/chat] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
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
