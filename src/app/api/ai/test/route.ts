/**
 * Test endpoint to verify Gemini API setup
 * Using direct REST API calls
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not found in environment variables',
        hint: 'Add GEMINI_API_KEY=your_key to .env.local'
      }, { status: 500 });
    }

    // Test with direct REST API call using v1beta endpoint with Gemini 2.5
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    
    console.log('Testing Gemini API with gemini-2.5-flash-lite model');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say hello in one word' }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working!',
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      testResponse: text,
      model: 'gemini-2.5-flash-lite',
      apiVersion: 'v1beta'
    });

  } catch (error) {
    console.error('Gemini API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check if your API key is valid and has Gemini API enabled'
    }, { status: 500 });
  }
}
