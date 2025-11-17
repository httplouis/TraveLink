/**
 * Extract Conversation Data from Cursor's state.vscdb
 * 
 * This script extracts conversation data from Cursor's SQLite database
 * 
 * Prerequisites:
 * 1. Install Node.js
 * 2. Install sqlite3: npm install sqlite3
 * 
 * Usage:
 * node extract-cursor-conversation.js
 */

const fs = require('fs');
const path = require('path');

// Path to the state.vscdb file
const dbPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'Cursor',
  'User',
  'workspaceStorage',
  '6c9130e03c6ec207044be661c47741e8',
  'state.vscdb'
);

console.log('🔍 Extracting conversation data from:', dbPath);
console.log('');

// Check if file exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found at:', dbPath);
  console.log('\n💡 Make sure the path is correct for your system.');
  process.exit(1);
}

// Try to read the database
try {
  // Check if sqlite3 is available
  let sqlite3;
  try {
    sqlite3 = require('sqlite3');
  } catch (e) {
    console.error('❌ sqlite3 module not found.');
    console.log('\n📦 Install it with: npm install sqlite3');
    console.log('\n💡 Alternative: Use a SQLite browser tool like DB Browser for SQLite');
    console.log('   Download: https://sqlitebrowser.org/');
    console.log('\n   Then open:', dbPath);
    process.exit(1);
  }

  const { Database } = require('sqlite3').verbose();
  
  const db = new Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err.message);
      process.exit(1);
    }
    console.log('✅ Database opened successfully');
  });

  // Get all table names
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ Error reading tables:', err.message);
      db.close();
      return;
    }

    console.log('\n📊 Found tables:');
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });

    // Look for conversation-related tables
    const conversationTables = tables.filter(t => 
      t.name.toLowerCase().includes('conversation') ||
      t.name.toLowerCase().includes('chat') ||
      t.name.toLowerCase().includes('message') ||
      t.name.toLowerCase().includes('agent') ||
      t.name.toLowerCase().includes('item')
    );

    if (conversationTables.length === 0) {
      console.log('\n⚠️  No obvious conversation tables found.');
      console.log('   Trying to read all tables...\n');
      
      // Read all tables
      tables.forEach(table => {
        db.all(`SELECT * FROM ${table.name} LIMIT 10`, (err, rows) => {
          if (!err && rows.length > 0) {
            console.log(`\n📄 Table: ${table.name}`);
            console.log(`   Rows: ${rows.length}`);
            console.log('   Sample data:', JSON.stringify(rows[0], null, 2));
          }
        });
      });

      setTimeout(() => {
        db.close();
        console.log('\n✅ Done! Check the output above for conversation data.');
      }, 2000);
    } else {
      console.log('\n✅ Found conversation-related tables:');
      conversationTables.forEach(table => {
        console.log(`   - ${table.name}`);
        
        // Read all data from these tables
        db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
          if (err) {
            console.error(`   ❌ Error reading ${table.name}:`, err.message);
            return;
          }

          console.log(`\n📄 ${table.name} (${rows.length} rows):`);
          
          // Try to find message/content fields
          rows.forEach((row, index) => {
            const data = JSON.stringify(row, null, 2);
            console.log(`\n   [${index + 1}]`, data);
          });

          // Export to file
          const outputFile = `conversation-${table.name}-${Date.now()}.json`;
          fs.writeFileSync(outputFile, JSON.stringify(rows, null, 2));
          console.log(`\n   💾 Exported to: ${outputFile}`);
        });
      });

      setTimeout(() => {
        db.close();
        console.log('\n✅ Done! Conversation data extracted and saved to JSON files.');
      }, 3000);
    }
  });

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Alternative method:');
  console.log('   1. Download DB Browser for SQLite: https://sqlitebrowser.org/');
  console.log('   2. Open the file:', dbPath);
  console.log('   3. Browse the tables and export data manually');
}

