// Simple test API to debug submissions issues
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Test API called");
    
    // Return mock data to test if the component works
    const mockData = [
      {
        id: "test-1",
        request_number: "TO-2025-TEST",
        title: "Test Request",
        purpose: "Testing the WOW factor system",
        destination: "Manila",
        travel_start_date: "2025-11-15",
        travel_end_date: "2025-11-16",
        status: "pending_head",
        created_at: "2025-11-13T00:00:00Z",
        has_budget: true,
        total_budget: 15000,
        department: {
          code: "TEST",
          name: "Test Department"
        }
      }
    ];

    return NextResponse.json({ 
      ok: true, 
      data: mockData,
      message: "Test API working - this is mock data"
    });
  } catch (err: any) {
    console.error("Test API error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
