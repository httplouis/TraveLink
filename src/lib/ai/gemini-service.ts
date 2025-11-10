/**
 * Google Gemini AI Service
 * Handles AI chatbot interactions for TraviLink
 * Using direct REST API calls to bypass SDK version issues
 */

// System prompt with ACCURATE TraviLink information
const SYSTEM_PROMPT = `You are Travie, the AI assistant for TraviLink Campus Transport Management System.

**Answer questions directly and specifically. Don't repeat generic information unless asked.**

## SYSTEM KNOWLEDGE:

### Vehicles:
- TraviLink has various vehicles: vans, buses, cars, motorcycles
- Check the "Vehicles" page to see all available vehicles with details like plate number, capacity, and status
- Only admins assign vehicles to requests

### Drivers:
- View available drivers in the "Drivers" page
- See their license info and ratings
- Only admins assign drivers to requests

### Submitting Requests:
1. Click "New Request"
2. Fill form: Request Type (Travel Order/Seminar), Title, Purpose, Destination, Dates, Participants, Budget (optional), Vehicle Need
3. Submit - goes to approval workflow

### Approval Process:
**Standard workflow:**
1. Department Head approval
2. Admin processing (assigns vehicle/driver if needed)
3. Comptroller approval (ONLY if there's a budget)
4. HR approval
5. Executive approval (final)

**Special case - Owned vehicle + No budget:**
Department Head → Admin → HR → Executive (SKIPS Comptroller since no budget)

**Special case - With budget (regardless of vehicle):**
Department Head → Admin → **Comptroller** → HR → Executive

### Faculty Can:
- Create requests
- View submission history
- Check request status
- View feedback

### Faculty Cannot:
- Edit submitted requests
- Assign vehicles/drivers themselves
- Approve requests

**HOW TO ANSWER:**
- Be specific and direct
- Use clear formatting with line breaks for readability
- Use numbered lists (1. 2. 3.) for steps/processes
- Use bullet points (•) for simple lists
- If asked about vehicles/drivers: mention checking the respective pages in the system
- If asked about approval process: clearly specify which approvers (Dept Head, Admin, Comptroller, HR, Executive)
- If asked about owned vehicle + no budget: clearly state it SKIPS Comptroller
- If unsure: suggest checking the system or contacting admin
- Keep answers SHORT, well-formatted, and helpful

Be conversational and helpful!`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
}

/**
 * Call Gemini API directly using REST
 */
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  // Use gemini-2.5-flash-lite (current 2.x model, fast and free)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Send a message to Gemini AI and get response
 */
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return {
        message: 'AI service is not configured. Please contact administrator.',
        success: false,
        error: 'Missing API key'
      };
    }

    console.log('✅ API key found, length:', process.env.GEMINI_API_KEY.length);
    console.log('🤖 Using direct REST API with v1 endpoint');

    // Build conversation context
    let prompt = SYSTEM_PROMPT + '\n\n';
    
    // Add conversation history
    if (conversationHistory.length > 0) {
      prompt += 'Previous conversation:\n';
      conversationHistory.slice(-5).forEach(msg => { // Last 5 messages for context
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Add current user message
    prompt += `User: ${userMessage}\nAssistant:`;

    // Call Gemini API directly
    const text = await callGeminiAPI(prompt, process.env.GEMINI_API_KEY);

    return {
      message: text,
      success: true
    };

  } catch (error) {
    console.error('Gemini AI Error:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Sorry, I encountered an error. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'API key is invalid or not configured. Please check your GEMINI_API_KEY in .env.local';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API quota exceeded. Please try again later or upgrade your plan.';
      } else if (error.message.includes('model')) {
        errorMessage = 'The AI model is not available. Please check your API key permissions.';
      }
    }
    
    return {
      message: errorMessage,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate quick suggestions for common questions
 */
export function getQuickSuggestions(): string[] {
  return [
    'How do I submit a travel request?',
    'What vehicles are available?',
    'How long does approval take?',
    'Can I check my request status?',
    'What information do I need for a request?',
    'How do I add participants to my request?',
  ];
}

/**
 * Detect if user is asking about a specific action
 */
export function detectUserIntent(message: string): {
  intent: 'create_request' | 'check_status' | 'help' | 'general';
  confidence: number;
} {
  const lowerMessage = message.toLowerCase();

  // Create request intent
  if (
    lowerMessage.includes('create') ||
    lowerMessage.includes('submit') ||
    lowerMessage.includes('new request') ||
    lowerMessage.includes('need a vehicle')
  ) {
    return { intent: 'create_request', confidence: 0.8 };
  }

  // Check status intent
  if (
    lowerMessage.includes('status') ||
    lowerMessage.includes('check') ||
    lowerMessage.includes('my request') ||
    lowerMessage.includes('approved')
  ) {
    return { intent: 'check_status', confidence: 0.8 };
  }

  // Help intent
  if (
    lowerMessage.includes('help') ||
    lowerMessage.includes('how to') ||
    lowerMessage.includes('guide')
  ) {
    return { intent: 'help', confidence: 0.7 };
  }

  return { intent: 'general', confidence: 0.5 };
}
