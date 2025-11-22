// src/lib/utils/getBaseUrl.ts
/**
 * Get the base URL for the application
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL (explicit production URL - should be set in Vercel)
 * 2. Request headers (origin/host) - works for current request
 * 3. VERCEL_URL (auto-set by Vercel in production)
 * 4. localhost (development only - NEVER in production)
 * 
 * This ensures email links work on mobile devices by always using the production URL
 */
import { NextRequest } from "next/server";

export function getBaseUrl(req?: NextRequest | Request | null): string {
  // Priority 1: Explicit environment variable (BEST for production)
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (baseUrl) {
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');
    // Ensure it has protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    console.log(`[getBaseUrl] ✅ Using NEXT_PUBLIC_APP_URL: ${baseUrl}`);
    return baseUrl;
  }
  
  // Priority 2: Request headers (works for current request, but not reliable for email links)
  if (req) {
    const origin = req.headers?.get('origin');
    const host = req.headers?.get('host');
    const forwardedHost = req.headers?.get('x-forwarded-host');
    const protocol = req.headers?.get('x-forwarded-proto') || 
                    (req.headers?.get('x-forwarded-ssl') === 'on' ? 'https' : 'http');
    
    // Prefer origin, then forwarded-host, then host
    const requestHost = origin?.replace(/^https?:\/\//, '') || 
                       forwardedHost || 
                       host;
    
    if (requestHost && !requestHost.includes('localhost') && !requestHost.includes('127.0.0.1')) {
      // Use https for production (unless explicitly http)
      const finalProtocol = protocol === 'http' ? 'http' : 'https';
      baseUrl = `${finalProtocol}://${requestHost}`;
      console.log(`[getBaseUrl] 🌐 Using baseUrl from request headers: ${baseUrl}`);
      return baseUrl;
    }
  }
  
  // Priority 3: VERCEL_URL (auto-set by Vercel in production)
  if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
    console.log(`[getBaseUrl] 🌐 Using baseUrl from VERCEL_URL: ${baseUrl}`);
    return baseUrl;
  }
  
  // Priority 4: localhost (ONLY for development)
  if (process.env.NODE_ENV === 'production') {
    // In production, we should NEVER use localhost
    console.error(`[getBaseUrl] ❌ CRITICAL: No baseUrl found in production!`);
    console.error(`[getBaseUrl] ❌ Set NEXT_PUBLIC_APP_URL environment variable in Vercel!`);
    console.error(`[getBaseUrl] ❌ This will cause email links to fail on mobile devices!`);
    // Still use localhost as fallback but log critical error
    baseUrl = "http://localhost:3000";
  } else {
    baseUrl = "http://localhost:3000";
    console.log(`[getBaseUrl] 🏠 Using localhost for development: ${baseUrl}`);
    console.log(`[getBaseUrl] ⚠️ WARNING: Email links with localhost will NOT work on mobile devices!`);
    console.log(`[getBaseUrl] 💡 For local testing on mobile, use ngrok or deploy to production`);
    console.log(`[getBaseUrl] 💡 Or set NEXT_PUBLIC_APP_URL to your production URL (even in local dev)`);
  }
  
  // Warn if using localhost (in any environment when sending emails)
  if (baseUrl.includes('localhost')) {
    console.warn(`[getBaseUrl] ⚠️ WARNING: Using localhost - email links will NOT work on mobile devices!`);
    if (process.env.NODE_ENV === 'production') {
      console.error(`[getBaseUrl] ⚠️ CRITICAL: This is PRODUCTION! Set NEXT_PUBLIC_APP_URL immediately!`);
    } else {
      console.warn(`[getBaseUrl] ⚠️ For mobile testing: Use ngrok or set NEXT_PUBLIC_APP_URL to production URL`);
    }
    console.warn(`[getBaseUrl] ⚠️ SOLUTION: Set NEXT_PUBLIC_APP_URL in Vercel to your MAIN production URL`);
    console.warn(`[getBaseUrl] ⚠️ Example: https://travilink.vercel.app (or your custom domain)`);
  }
  
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  return baseUrl;
}

