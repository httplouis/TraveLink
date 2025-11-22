# Recover Stuck Conversation Data

If you have a conversation in Cursor that's stuck loading, you can try to recover the data using these methods:

## Method 1: Browser Console Script (Recommended)

1. **Open Cursor**
2. **Press `F12`** (or `Ctrl+Shift+I` / `Cmd+Option+I` on Mac) to open DevTools
3. **Go to the Console tab**
4. **Copy the entire contents of `recover-conversation.js`**
5. **Paste it into the console and press Enter**
6. **Look for conversation data in the output**

The script will:
- Check `localStorage` for conversation data
- Check `sessionStorage` for conversation data  
- Check `IndexedDB` for conversation data
- Provide a function `exportConversationData()` to download all data as JSON

## Method 2: Manual Browser Storage Inspection

1. **Open DevTools** (F12)
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Check these sections:**
   - **Local Storage** → Look for keys containing "conversation", "chat", "message", "agent", or "cursor"
   - **Session Storage** → Same as above
   - **IndexedDB** → Look for databases with similar names

4. **Copy any relevant data** you find

## Method 3: Check Cursor's Data Directory

Cursor stores data locally. You can find it at:

**Windows:**
```
%APPDATA%\Cursor\User\workspaceStorage\
```

**Mac:**
```
~/Library/Application Support/Cursor/User/workspaceStorage/
```

**Linux:**
```
~/.config/Cursor/User/workspaceStorage/
```

Look for folders with your workspace name and check for:
- `state.vscdb` files
- JSON files containing conversation data

## Method 4: Export Function

After running the script, you can use:

```javascript
// In browser console
const data = exportConversationData();
// This will download a JSON file with all conversation data
```

## What to Look For

The conversation data might be stored as:
- Message arrays with `role` and `content` fields
- Conversation history objects
- Chat state with messages and metadata
- Agent conversation data

## If You Find the Data

1. **Copy the conversation messages** (usually an array of objects)
2. **Start a new conversation** in Cursor
3. **Paste the messages** or summarize the context
4. **Continue from where you left off**

## Alternative: Manual Recovery

If you remember what you were working on:
1. Start a new conversation
2. Describe the task/context
3. Ask to continue from where you left off
4. Provide any relevant code snippets or file paths you remember

## Need Help?

If the script doesn't find anything, the conversation data might be:
- Stored in Cursor's backend (not accessible locally)
- Corrupted and unrecoverable
- Already cleared from storage

In that case, starting fresh with a new conversation and providing context is your best option.

