// src/lib/ai/gemini.ts
/**
 * Google Gemini AI Integration
 * Used for smart analytics insights and natural language processing
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export interface GeminiInsight {
  summary: string;
  trends: string[];
  recommendations: string[];
  keyMetrics: Record<string, string>;
}

/**
 * Generate AI insights from dashboard analytics data
 */
export async function generateAnalyticsInsights(data: {
  stats: any;
  analytics: any;
  monthlyTrends: any[];
}): Promise<GeminiInsight | null> {
  if (!GEMINI_API_KEY) {
    console.warn("[Gemini] API key not configured, skipping AI insights");
    return null;
  }

  try {
    const prompt = `You are an analytics expert analyzing travel request data. Provide insights in JSON format.

Data:
- Active Requests: ${data.stats.activeRequests}
- Pending Approvals: ${data.stats.pendingApprovals}
- This Month Requests: ${data.stats.thisMonthRequests}
- Last Month Requests: ${data.stats.lastMonthRequests}
- Request Trend: ${data.stats.requestTrend}%
- Average Approval Days: ${data.analytics.avgApprovalDays}
- Monthly Trends: ${JSON.stringify(data.monthlyTrends)}

Provide a JSON response with:
{
  "summary": "Brief 2-3 sentence summary of the user's request activity",
  "trends": ["trend 1", "trend 2", "trend 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "keyMetrics": {
    "metric1": "value/insight",
    "metric2": "value/insight"
  }
}

Keep responses concise and actionable. Focus on patterns and opportunities.`;

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    if (!response.ok) {
      console.error("[Gemini] API error:", response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("[Gemini] No text in response");
      return null;
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

    try {
      const insights = JSON.parse(jsonText);
      return insights as GeminiInsight;
    } catch (parseError) {
      console.error("[Gemini] Failed to parse JSON:", parseError);
      // Fallback: return structured response from text
      return {
        summary: text.split('\n')[0] || "AI insights generated",
        trends: [],
        recommendations: [],
        keyMetrics: {},
      };
    }
  } catch (err: any) {
    console.error("[Gemini] Error generating insights:", err);
    return null;
  }
}

/**
 * Ask Gemini a question about the data
 */
export async function askGemini(question: string, context: any): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return null;
  }

  try {
    const prompt = `Context: ${JSON.stringify(context, null, 2)}

Question: ${question}

Provide a concise, helpful answer based on the context.`;

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("[Gemini] Error asking question:", err);
    return null;
  }
}

