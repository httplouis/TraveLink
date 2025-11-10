/**
 * List available Gemini models
 * This helps us find which models actually work with your API key
 */

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not found'
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list available models
    console.log('Fetching available models...');
    
    // The SDK might not have a listModels method directly accessible
    // So let's try different model names and see which ones work
    const modelsToTry = [
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro',
      'models/gemini-1.5-flash-8b',
      'models/gemini-1.5-flash',
      'models/gemini-pro',
    ];

    const availableModels = [];
    const unavailableModels = [];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('test');
        await result.response;
        
        availableModels.push({
          name: modelName,
          status: 'working',
          tested: true
        });
        console.log(`✅ ${modelName} works!`);
      } catch (error) {
        unavailableModels.push({
          name: modelName,
          status: 'not available',
          error: error instanceof Error ? error.message : 'Unknown'
        });
        console.log(`❌ ${modelName} failed`);
      }
    }

    return NextResponse.json({
      success: true,
      availableModels,
      unavailableModels,
      recommendedModel: availableModels.length > 0 ? availableModels[0].name : null,
      totalTested: modelsToTry.length,
      message: availableModels.length > 0 
        ? `Found ${availableModels.length} working model(s)!`
        : 'No working models found. Check your API key permissions.'
    });

  } catch (error) {
    console.error('List Models Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
