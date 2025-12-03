// src/lib/sms/sms-service.ts
/**
 * SMS Service for sending notifications to drivers
 * Supports multiple SMS providers (Twilio, Semaphore, etc.)
 */

interface SendSMSOptions {
  to: string; // Phone number (Philippines format: +63XXXXXXXXXX or 09XXXXXXXXX)
  message: string;
  provider?: 'twilio' | 'semaphore' | 'console'; // Default: console for dev, twilio for prod
}

interface SMSResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Normalize phone number to international format
 * Converts: 09123456789, 9123456789, +639123456789 → +639123456789
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 0, replace with +63
  if (cleaned.startsWith('0')) {
    cleaned = '+63' + cleaned.substring(1);
  }
  // If starts with 9 (without country code), add +63
  else if (cleaned.startsWith('9') && !cleaned.startsWith('+63')) {
    cleaned = '+63' + cleaned;
  }
  // If already has +63, keep it
  else if (!cleaned.startsWith('+63')) {
    cleaned = '+63' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Philippines mobile: +63 followed by 10 digits (9XXXXXXXXX)
  return /^\+63[9]\d{9}$/.test(normalized);
}

/**
 * Send SMS using Twilio
 */
async function sendViaTwilio(to: string, message: string): Promise<SMSResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.',
    };
  }

  try {
    const normalizedTo = normalizePhoneNumber(to);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: normalizedTo,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[sendSMS] Twilio API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send SMS via Twilio',
      };
    }

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (err: any) {
    console.error('[sendSMS] Twilio error:', err);
    return {
      success: false,
      error: err.message || 'Failed to send SMS via Twilio',
    };
  }
}

/**
 * Send SMS using Semaphore (Philippines-based SMS provider)
 */
async function sendViaSemaphore(to: string, message: string): Promise<SMSResponse> {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER_NAME || 'TRAVILINK';

  if (!apiKey) {
    return {
      success: false,
      error: 'Semaphore API key not configured. Please set SEMAPHORE_API_KEY environment variable.',
    };
  }

  try {
    const normalizedTo = normalizePhoneNumber(to);
    // Remove + for Semaphore API
    const phoneNumber = normalizedTo.replace('+', '');

    const response = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        number: phoneNumber,
        message: message,
        sendername: senderName,
      }),
    });

    const data = await response.json();

    if (!response.ok || data[0]?.status === 'Failed') {
      console.error('[sendSMS] Semaphore API error:', data);
      return {
        success: false,
        error: data[0]?.message || 'Failed to send SMS via Semaphore',
      };
    }

    return {
      success: true,
      messageId: data[0]?.message_id || 'unknown',
    };
  } catch (err: any) {
    console.error('[sendSMS] Semaphore error:', err);
    return {
      success: false,
      error: err.message || 'Failed to send SMS via Semaphore',
    };
  }
}

/**
 * Send SMS (console mode for development)
 */
async function sendViaConsole(to: string, message: string): Promise<SMSResponse> {
  const normalizedTo = normalizePhoneNumber(to);
  
  console.log('============================================================');
  console.log('📱 SMS WOULD BE SENT (No SMS provider configured)');
  console.log('============================================================');
  console.log(`To: ${normalizedTo}`);
  console.log(`Message: ${message}`);
  console.log('============================================================');
  console.log('⚠️  NOTE: This is console mode - SMS was NOT actually sent!');
  console.log('⚠️  To enable real SMS, configure SMS provider in environment variables');
  console.log('============================================================');
  
  return {
    success: false, // Changed to false so caller knows SMS wasn't actually sent
    error: 'SMS provider not configured. Running in console mode (development only). Configure TWILIO_* or SEMAPHORE_API_KEY to enable real SMS.',
    messageId: `console-${Date.now()}`,
  };
}

/**
 * Main SMS sending function
 */
export async function sendSMS({
  to,
  message,
  provider,
}: SendSMSOptions): Promise<SMSResponse> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[sendSMS] 📱 Sending SMS to ${to}`);
  }

  // Validate phone number
  if (!isValidPhoneNumber(to)) {
    return {
      success: false,
      error: `Invalid phone number format: ${to}. Expected Philippines format: +63XXXXXXXXXX or 09XXXXXXXXX`,
    };
  }

  // Determine provider
  let smsProvider = provider;
  
  if (!smsProvider) {
    // Auto-detect based on environment variables
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      smsProvider = 'twilio';
      if (process.env.NODE_ENV === 'development') {
        console.log(`[sendSMS] ✅ Using Twilio provider`);
      }
    } else if (process.env.SEMAPHORE_API_KEY) {
      smsProvider = 'semaphore';
      if (process.env.NODE_ENV === 'development') {
        console.log(`[sendSMS] ✅ Using Semaphore provider`);
      }
    } else {
      smsProvider = 'console'; // Development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[sendSMS] ⚠️ No SMS provider configured - using console mode (SMS will only be logged, not sent)`);
        console.warn(`[sendSMS] ⚠️ To enable real SMS, configure either:`);
        console.warn(`[sendSMS]    - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER`);
        console.warn(`[sendSMS]    - SEMAPHORE_API_KEY`);
      }
    }
  }

  // Send via selected provider
  switch (smsProvider) {
    case 'twilio':
      return await sendViaTwilio(to, message);
    case 'semaphore':
      return await sendViaSemaphore(to, message);
    case 'console':
    default:
      return await sendViaConsole(to, message);
  }
}

/**
 * Send travel notification SMS to driver
 */
export async function sendDriverTravelNotification(params: {
  driverPhone: string;
  requesterName: string;
  requesterPhone: string;
  travelDate: string;
  destination: string;
  purpose?: string;
  pickupLocation?: string;
  pickupTime?: string;
  pickupPreference?: 'pickup' | 'self' | 'gymnasium';
  requestNumber: string;
}): Promise<SMSResponse> {
  const {
    driverPhone,
    requesterName,
    requesterPhone,
    travelDate,
    destination,
    purpose,
    pickupLocation,
    pickupTime,
    pickupPreference,
    requestNumber,
  } = params;

  // Check for demo mode override
  const demoPhone = process.env.DEMO_DRIVER_PHONE;
  const actualPhone = driverPhone;
  const targetPhone = demoPhone || driverPhone;

  if (demoPhone) {
    console.log(`[sendSMS] 📱 [DEMO MODE] Redirecting SMS to demo number: ${demoPhone} (original: ${actualPhone})`);
  }

  // Format travel date (Month Day, Year format)
  const dateObj = new Date(travelDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build pickup instruction
  let pickupInstruction = '';
  if (pickupPreference === 'gymnasium') {
    pickupInstruction = 'Pickup Location: Gymnasium';
  } else if (pickupPreference === 'pickup' && pickupLocation) {
    pickupInstruction = `Pickup Location: ${pickupLocation}`;
    if (pickupTime) {
      pickupInstruction += `\nPickup Time: ${pickupTime}`;
    }
  } else if (pickupPreference === 'self') {
    pickupInstruction = 'Self-transport (no pickup needed)';
  }

  // Build message
  let message = `TRAVILINK - Travel Assignment

Request: ${requestNumber}
Date: ${formattedDate}
Destination: ${destination}`;

  // Add purpose if provided
  if (purpose) {
    message += `\nPurpose: ${purpose}`;
  }

  message += `

Requester: ${requesterName}
Contact: ${requesterPhone}`;

  // Add pickup instruction if applicable
  if (pickupInstruction) {
    message += `\n\n${pickupInstruction}`;
  }

  message += `\n\nPlease coordinate with the requester for travel details.`;

  return await sendSMS({
    to: targetPhone,
    message: message.trim(),
  });
}

