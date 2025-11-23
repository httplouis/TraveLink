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

export function getBaseUrl(req?: NextRequest | Request | null, forceProduction?: boolean): string {
  // If forceProduction is true (for email links), ALWAYS use production URL
  if (forceProduction) {
    const productionUrl = "https://travilink.vercel.app";
    console.log(`[getBaseUrl] 📧 Using production URL for email links: ${productionUrl}`);
    return productionUrl;
  }

  // Check if we're in Vercel environment first
  const isVercel = !!process.env.VERCEL;
  const isProduction = process.env.NODE_ENV === 'production' || isVercel;
  
  // Priority 1: Explicit environment variable (BEST for production)
  let baseUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL;
  
  if (baseUrl) {
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');
    // Ensure it has protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    // Never use localhost if explicitly set
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      console.warn(`[getBaseUrl] ⚠️ NEXT_PUBLIC_APP_URL contains localhost, ignoring and using production URL instead`);
      baseUrl = undefined; // Force fallback
    } else {
      console.log(`[getBaseUrl] ✅ Using NEXT_PUBLIC_APP_URL: ${baseUrl}`);
      return baseUrl;
    }
  }

  // Priority 2: ALWAYS use production URL if we're NOT in local development
  // This is critical for email links - they MUST use production URL
  // Check if we're actually running on localhost by checking request headers
  const isLocalhost = req ? (
    req.headers?.get('host')?.includes('localhost') || 
    req.headers?.get('host')?.includes('127.0.0.1') ||
    req.headers?.get('origin')?.includes('localhost') ||
    req.headers?.get('origin')?.includes('127.0.0.1')
  ) : (
    typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    )
  );

  // If we're in Vercel or production, ALWAYS use production URL (even if headers say localhost)
  // This ensures email links always work in production
  if (isVercel || isProduction) {
    baseUrl = "https://travilink.vercel.app";
    console.log(`[getBaseUrl] 🌐 Using production URL (Vercel/production detected): ${baseUrl}`);
    console.log(`[getBaseUrl] 💡 To customize, set NEXT_PUBLIC_APP_URL in Vercel environment variables`);
    return baseUrl;
  }

  // If NOT localhost (based on request headers), use production URL
  // This catches cases where we're deployed but headers might be weird
  if (!isLocalhost) {
    baseUrl = "https://travilink.vercel.app";
    console.log(`[getBaseUrl] 🌐 Using production URL (not localhost): ${baseUrl}`);
    return baseUrl;
  }

  // Priority 3: VERCEL_URL (auto-set by Vercel) - only use if not already handled above
  if (process.env.VERCEL_URL) {
    // VERCEL_URL might be just the domain (e.g., "travilink.vercel.app") or with protocol
    let vercelUrl = process.env.VERCEL_URL;
    if (!vercelUrl.startsWith('http://') && !vercelUrl.startsWith('https://')) {
      vercelUrl = `https://${vercelUrl}`;
    }
    baseUrl = vercelUrl;
    console.log(`[getBaseUrl] 🌐 Using baseUrl from VERCEL_URL: ${baseUrl}`);
    return baseUrl;
  }
  
  // Priority 4: Request headers (works for current request, but not reliable for email links)
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
  
  // Priority 5: Default fallback (development only)
  // This should only be reached in local development
  baseUrl = "http://localhost:3000";
  console.log(`[getBaseUrl] 🏠 Using localhost for development: ${baseUrl}`);
  console.log(`[getBaseUrl] ⚠️ WARNING: Email links with localhost will NOT work on mobile devices!`);
  console.log(`[getBaseUrl] 💡 For local testing on mobile, use ngrok or deploy to production`);
  console.log(`[getBaseUrl] 💡 Or set NEXT_PUBLIC_APP_URL to your production URL (even in local dev)`);
  
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

