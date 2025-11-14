# 🎨 Cursor IDE Interface Setup Guide

## 📁 Move Sidebar to Right Side

### Method 1: Right-Click Menu
1. **Right-click** on the **sidebar** (left side where files are)
2. Click **"Move Primary Side Bar Right"** or **"Move Side Bar Right"**

### Method 2: Command Palette
1. Press **`Ctrl+Shift+P`** (Windows) or **`Cmd+Shift+P`** (Mac)
2. Type: **"View: Move Primary Side Bar Right"**
3. Press **Enter**

### Method 3: Menu Bar
1. Click **View** → **Appearance** → **Move Primary Side Bar Right**

### Method 4: Keyboard Shortcut
- Press **`Ctrl+K`** then **`Ctrl+B`** to toggle sidebar
- Then use **`Ctrl+Shift+P`** → "Move Primary Side Bar Right"

---

## 📂 Show File Explorer (Like VS Code)

### If File Explorer is Hidden:
1. **Press:** `Ctrl+Shift+E` (Windows) or `Cmd+Shift+E` (Mac)
   - OR
2. **Click:** View → Explorer
   - OR
3. **Click:** the **folder icon** in the left sidebar

### File Explorer Features:
- **Expand/Collapse folders:** Click the arrow (▶) next to folder names
- **Open file:** Click the file name
- **Create new file:** Right-click folder → "New File"
- **Create new folder:** Right-click folder → "New Folder"
- **Rename:** Right-click file/folder → "Rename" or press `F2`
- **Delete:** Right-click → "Delete" or press `Delete`

---

## 🎯 Recommended Layout (VS Code Style)

### Left Sidebar (or Right if you moved it):
1. **Explorer** (📁) - File tree
2. **Search** (🔍) - Find in files
3. **Source Control** (🌿) - Git
4. **Extensions** (🧩) - Install extensions
5. **AI Chat** (💬) - Cursor AI features

### Bottom Panel:
- **Terminal** - Command line
- **Problems** - Errors/warnings
- **Output** - Console logs
- **Debug Console** - Debugging

### Top:
- **Menu Bar** - File, Edit, View, etc.
- **Tabs** - Open files

---

## ⌨️ Useful Keyboard Shortcuts

| Action | Windows | Mac |
|--------|---------|-----|
| Toggle Sidebar | `Ctrl+B` | `Cmd+B` |
| Open File Explorer | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Open Search | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Open Terminal | `Ctrl+`` | `Cmd+`` |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| New File | `Ctrl+N` | `Cmd+N` |
| Save File | `Ctrl+S` | `Cmd+S` |
| Close Tab | `Ctrl+W` | `Cmd+W` |
| Switch Tabs | `Ctrl+Tab` | `Cmd+Tab` |

---

## 🔄 Swap File Explorer and AI Chat Panel

**Current Setup:** File Explorer (right) + AI Chat (left)  
**Goal:** File Explorer (left) + AI Chat (right)

### ✅ METHOD 1: Drag and Drop (Easiest!)

1. **Click and HOLD** on the **File Explorer tab** (right side, where it says "TRAVILINK" or folder icon)
2. **Drag it** to the **LEFT side** of the screen
3. **Drop it** when you see a blue line/indicator on the left
4. **Click and HOLD** on the **AI Chat tab** (left side)
5. **Drag it** to the **RIGHT side** of the screen
6. **Drop it** when you see a blue line/indicator on the right

**That's it!** No commands needed! 🎯

---

### ✅ METHOD 2: Right-Click Context Menu

#### Step 1: Move File Explorer to Left
1. **Right-click** on the **File Explorer panel header** (the bar at the top where it says "TRAVILINK")
2. Look for:
   - **"Move Panel Left"**
   - **"Move to Left"**
   - **"Move Primary Side Bar Left"**
3. Click it

#### Step 2: Move AI Chat to Right
1. **Right-click** on the **AI Chat panel header** (the bar at the top where it says "Design and develop...")
2. Look for:
   - **"Move Panel Right"**
   - **"Move to Right"**
   - **"Move Secondary Side Bar Right"**
3. Click it

---

### ✅ METHOD 3: Command Palette (Try These Exact Names)

Press **`Ctrl+Shift+P`** and try these commands **one by one**:

#### For File Explorer (move to left):
- `View: Move Primary Side Bar Left`
- `Workbench: Move Primary Side Bar Left`
- `Move Side Bar Left`
- `Side Bar: Move Left`

#### For AI Chat (move to right):
- `View: Move Secondary Side Bar Right`
- `Workbench: Move Secondary Side Bar Right`
- `Move Panel Right`
- `Panel: Move Right`
- `Chat: Move Right`

---

### ✅ METHOD 4: Settings.json (Manual Configuration)

If nothing works, we can manually configure it:

1. Press **`Ctrl+Shift+P`**
2. Type: **"Preferences: Open User Settings (JSON)"**
3. Add these lines:
```json
{
  "workbench.sideBar.location": "left",
  "workbench.panel.defaultLocation": "right"
}
```

---

### ✅ METHOD 5: View Menu

1. Click **View** in the top menu bar
2. Go to **Appearance**
3. Look for:
   - **"Primary Side Bar"** → **"Move Left"**
   - **"Secondary Side Bar"** → **"Move Right"**
   - **"Panel"** → **"Move Right"**

---

## 🔧 Customize Sidebar Position

### To Move Back to Left:
1. **Right-click** sidebar → **"Move Primary Side Bar Left"**
2. OR **Command Palette** (`Ctrl+Shift+P`) → "Move Primary Side Bar Left"

### To Hide Sidebar:
- Press **`Ctrl+B`** (toggle on/off)
- OR Click **View** → **Appearance** → **Primary Side Bar**

---

## 📋 Show/Hide Panels

### Bottom Panel (Terminal, Problems, etc.):
- **Toggle:** `Ctrl+J` (Windows) or `Cmd+J` (Mac)
- OR **View** → **Appearance** → **Panel**

### Activity Bar (Left icons):
- **Toggle:** Right-click sidebar → **"Hide Activity Bar"**
- OR **View** → **Appearance** → **Activity Bar**

---

## 🎨 Reset Layout

If you want to reset everything to default:
1. **Command Palette** (`Ctrl+Shift+P`)
2. Type: **"View: Reset View Locations"**
3. Press **Enter**

---

## 💡 Pro Tips

1. **Split Editor:** 
   - Right-click tab → "Split Right"
   - OR `Ctrl+\` to split vertically

2. **Minimap (Code Overview):**
   - **View** → **Appearance** → **Minimap** (toggle on/off)

3. **Breadcrumbs (File Path):**
   - **View** → **Appearance** → **Breadcrumbs** (toggle on/off)

4. **Zen Mode (Distraction Free):**
   - Press `Ctrl+K` then `Z`
   - OR **View** → **Appearance** → **Zen Mode**

---

**Try mo yung right-click sa sidebar para ilipat sa right!** 🚀

---

## 🎯 Quick Reference: Swap Panels

**To swap File Explorer ↔ AI Chat:**

### ⚡ FASTEST METHOD: Drag & Drop
1. **Click and HOLD** File Explorer tab (right) → **Drag to LEFT** → Drop
2. **Click and HOLD** AI Chat tab (left) → **Drag to RIGHT** → Drop

### 🔧 If Drag & Drop Doesn't Work:
I've added settings to `.vscode/settings.json`:
- `"workbench.sideBar.location": "left"` (File Explorer on left)
- `"workbench.panel.defaultLocation": "right"` (AI Chat on right)

**Restart Cursor** or **Reload Window** (`Ctrl+Shift+P` → "Developer: Reload Window")

**Result:** File Explorer (left) + AI Chat (right) ✅


