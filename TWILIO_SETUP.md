# Twilio SMS Setup Guide

## Environment Variables

Add these to your `.env.local` file:

```env
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
```

## Getting Your Twilio Phone Number

1. Log into [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers** → **Manage** → **Active numbers**
3. Copy the phone number (e.g., `+1 360 300 4305`)
4. Format it as: `+13603004305` (no spaces, include country code)
5. Add to `.env.local` as `TWILIO_PHONE_NUMBER`

## Driver Phone Number

- Driver: **Dave Gomez**
- Phone: `09935583858`
- The system will automatically normalize to: `+639935583858`

## Testing

The SMS service is already integrated. When admin assigns a driver to a request, SMS will be sent automatically.

## Phone Number Format

- Store in database: `09935583858` or `+639935583858`
- SMS service automatically normalizes to international format: `+639935583858`

