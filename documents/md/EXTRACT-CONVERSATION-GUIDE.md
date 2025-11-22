# Extract Conversation from Cursor's Database

You found the conversation data! Here's how to extract it:

## Method 1: Using Node.js Script (Recommended)

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/

2. **Install sqlite3 package**
   ```bash
   npm install sqlite3
   ```

3. **Run the extraction script**
   ```bash
   node extract-cursor-conversation.js
   ```

   This will:
   - Open the `state.vscdb` file
   - Find conversation-related tables
   - Extract all conversation data
   - Save it to JSON files

## Method 2: Using DB Browser for SQLite (Easier, No Coding)

1. **Download DB Browser for SQLite**
   - https://sqlitebrowser.org/
   - Free and easy to use

2. **Open the database file**
   - File → Open Database
   - Navigate to: `C:\Users\Ryzen 5 5600G\AppData\Roaming\Cursor\User\workspaceStorage\6c9130e03c6ec207044be661c47741e8\state.vscdb`

3. **Browse tables**
   - Look for tables with names like:
     - `ItemTable` (most likely)
     - `conversation`
     - `chat`
     - `message`
     - `agent`

4. **Export data**
   - Click on a table
   - File → Export → Export table(s) as JSON
   - Save the file

5. **Look for conversation data**
   - The data might be in JSON format within the database
   - Look for fields like: `messages`, `content`, `text`, `conversation`, etc.

## Method 3: Quick Manual Check

1. **Open the database** in DB Browser
2. **Go to "Browse Data" tab**
3. **Select each table** and look for:
   - Message arrays
   - Conversation history
   - Text content
   - User/assistant messages

4. **Copy the relevant data** when you find it

## What to Look For

The conversation data is likely stored as:
- **JSON objects** with `role` and `content` fields
- **Arrays of messages** like:
  ```json
  [
    { "role": "user", "content": "your message" },
    { "role": "assistant", "content": "AI response" }
  ]
  ```
- **Text fields** containing the full conversation
- **Metadata** with timestamps, IDs, etc.

## Once You Extract the Data

1. **Copy the conversation messages**
2. **Start a new conversation** in Cursor
3. **Paste or summarize** what you were working on
4. **Continue from where you left off**

## Example: What the Data Might Look Like

```json
{
  "id": "some-uuid",
  "messages": [
    {
      "role": "user",
      "content": "I need help with..."
    },
    {
      "role": "assistant", 
      "content": "Here's how to..."
    }
  ],
  "createdAt": "2025-11-18T...",
  "updatedAt": "2025-11-18T..."
}
```

## Need Help?

If you can't find the data:
1. Check the `state.vscdb.backup` file (might have older data)
2. Look in other workspace folders
3. The conversation might be stored in Cursor's cloud/backend (not recoverable locally)

Let me know what you find!

