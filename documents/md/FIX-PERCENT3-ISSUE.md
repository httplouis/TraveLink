# How to Remove "%3" from Word Document

## Quick Fix: Find & Replace in Word

1. **Open your Word document**
2. **Press `Ctrl + H`** (or go to Home → Replace)
3. **In the "Find what" field, type:** `%3`
4. **Leave "Replace with" field EMPTY** (blank)
5. **Click "Replace All"**
6. **Done!** All "%3" will be removed

---

## Alternative Method: Manual Search

1. **Press `Ctrl + F`** (Find)
2. **Type:** `%3`
3. **Word will highlight all occurrences**
4. **Manually delete each one** (or use Replace All)

---

## Why This Happens

The "%3" is likely appearing because:
- Word is interpreting markdown formatting incorrectly
- Auto-formatting is adding characters
- Encoding issue when copying from markdown to Word

**The source files are clean** - this is a Word display/formatting issue, not a problem with the markdown files.

---

## Prevention for Future

When copying from markdown to Word:
1. Paste as **Plain Text** first (Ctrl+Shift+V)
2. Then apply formatting manually
3. Or use a markdown-to-Word converter tool

---

## Files to Re-copy (if needed)

If Find & Replace doesn't work, re-copy these clean headings:

- `## 7.3 Development of TraviLink`
- `## 7.4 Design and Developed System`
- `## 7.5 Analysis of the Results of Black Box Testing`
- `## 7.6 TraviLink's User Testing and Evaluation`

All files are in: `TraviLink/manuscript-sections/`

