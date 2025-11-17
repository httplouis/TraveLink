/**
 * Conversation Recovery Script
 * Run this in your browser console to recover stuck conversation data
 * 
 * Instructions:
 * 1. Open Cursor
 * 2. Press F12 to open DevTools
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 6. Check the output for your conversation data
 */

console.log('🔍 Searching for conversation data...\n');

// Check localStorage
console.log('📦 Checking localStorage...');
const localStorageKeys = Object.keys(localStorage);
const conversationKeys = localStorageKeys.filter(key => 
  key.toLowerCase().includes('conversation') || 
  key.toLowerCase().includes('chat') ||
  key.toLowerCase().includes('message') ||
  key.toLowerCase().includes('agent') ||
  key.toLowerCase().includes('cursor')
);

if (conversationKeys.length > 0) {
  console.log('✅ Found localStorage keys:', conversationKeys);
  conversationKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      console.log(`\n📄 ${key}:`);
      console.log(JSON.parse(data));
    } catch (e) {
      console.log(`\n📄 ${key}:`, data);
    }
  });
} else {
  console.log('❌ No conversation keys found in localStorage');
}

// Check sessionStorage
console.log('\n📦 Checking sessionStorage...');
const sessionStorageKeys = Object.keys(sessionStorage);
const sessionConversationKeys = sessionStorageKeys.filter(key => 
  key.toLowerCase().includes('conversation') || 
  key.toLowerCase().includes('chat') ||
  key.toLowerCase().includes('message') ||
  key.toLowerCase().includes('agent') ||
  key.toLowerCase().includes('cursor')
);

if (sessionConversationKeys.length > 0) {
  console.log('✅ Found sessionStorage keys:', sessionConversationKeys);
  sessionConversationKeys.forEach(key => {
    try {
      const data = sessionStorage.getItem(key);
      console.log(`\n📄 ${key}:`);
      console.log(JSON.parse(data));
    } catch (e) {
      console.log(`\n📄 ${key}:`, data);
    }
  });
} else {
  console.log('❌ No conversation keys found in sessionStorage');
}

// Check IndexedDB
console.log('\n📦 Checking IndexedDB...');
async function checkIndexedDB() {
  try {
    const databases = await indexedDB.databases();
    console.log('✅ Found IndexedDB databases:', databases.map(db => db.name));
    
    for (const dbInfo of databases) {
      if (dbInfo.name.toLowerCase().includes('cursor') || 
          dbInfo.name.toLowerCase().includes('conversation') ||
          dbInfo.name.toLowerCase().includes('chat')) {
        console.log(`\n📊 Opening database: ${dbInfo.name}`);
        
        const request = indexedDB.open(dbInfo.name);
        request.onsuccess = (event) => {
          const db = event.target.result;
          const objectStoreNames = Array.from(db.objectStoreNames);
          console.log('   Object stores:', objectStoreNames);
          
          objectStoreNames.forEach(storeName => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
              console.log(`\n   📦 ${storeName} (${getAllRequest.result.length} items):`);
              getAllRequest.result.forEach((item, index) => {
                console.log(`   [${index}]`, item);
              });
            };
          });
        };
      }
    }
  } catch (error) {
    console.log('❌ Error checking IndexedDB:', error);
  }
}

checkIndexedDB();

// Export function to copy all conversation data
window.exportConversationData = function() {
  const allData = {
    localStorage: {},
    sessionStorage: {},
    timestamp: new Date().toISOString()
  };
  
  // Collect localStorage
  conversationKeys.forEach(key => {
    try {
      allData.localStorage[key] = JSON.parse(localStorage.getItem(key));
    } catch {
      allData.localStorage[key] = localStorage.getItem(key);
    }
  });
  
  // Collect sessionStorage
  sessionConversationKeys.forEach(key => {
    try {
      allData.sessionStorage[key] = JSON.parse(sessionStorage.getItem(key));
    } catch {
      allData.sessionStorage[key] = sessionStorage.getItem(key);
    }
  });
  
  // Create downloadable JSON
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Conversation data exported!');
  return allData;
};

console.log('\n💡 Tip: Run exportConversationData() to download all conversation data as JSON');

