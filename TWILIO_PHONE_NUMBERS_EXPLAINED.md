# Twilio Phone Numbers - Explanation

## Two Different Phone Numbers

### 1. TWILIO_PHONE_NUMBER (+13603004305)
**Purpose**: This is the number that SENDS SMS messages FROM Twilio
- This is your Twilio account's phone number
- You get this from Twilio Dashboard → Phone Numbers → Active Numbers
- This number appears as the "sender" when drivers receive SMS
- **Already configured**: `+13603004305`

### 2. Driver Phone Number (09935583858)
**Purpose**: This is the number that RECEIVES SMS messages
- This is Dave Gomez's phone number
- This number receives the travel notification SMS
- **Needs to be in database**: `09935583858` or `+639935583858`

## How SMS Works

```
Twilio Phone (+13603004305)  →  Sends SMS  →  Driver Phone (09935583858)
     (FROM)                                    (TO)
```

## How to Check/Update Driver Phone Number

### Option 1: Check Current Number in Database
Run this SQL in Supabase:

```sql
-- Check if Dave Gomez exists and what phone number he has
SELECT 
  id, 
  name, 
  email,
  phone_number,
  contact_number,
  role
FROM users 
WHERE name ILIKE '%dave%gomez%' 
  AND role = 'driver';
```

### Option 2: Update Driver Phone Number
If the number is missing or wrong, run:

```sql
-- Update Dave Gomez's phone number
UPDATE users 
SET phone_number = '09935583858',
    contact_number = '09935583858'
WHERE name ILIKE '%dave%gomez%' 
  AND role = 'driver';
```

### Option 3: Check via Admin Panel
1. Go to Admin → Drivers
2. Find "Dave Gomez"
3. Check if phone number is set
4. If not, edit and add: `09935583858`

## Testing SMS

The SMS will be sent automatically when:
- Admin assigns a driver to a request
- Request is approved by President (final approval)

To test manually, you can:
1. Assign Dave Gomez as driver to any request
2. Check console logs for SMS sending status
3. Dave Gomez should receive SMS on his phone: `09935583858`

## Phone Number Format

The system automatically converts:
- `09935583858` → `+639935583858` (for SMS sending)
- Both formats work in the database
- SMS service handles the conversion automatically

## Summary

- **SEND FROM**: `+13603004305` (Twilio number - already set)
- **SEND TO**: `09935583858` (Dave Gomez - needs to be in database)
- **Action Needed**: Make sure Dave Gomez's phone number is in the `users` table

