// Quick test to verify Gemini API key works
// Run this with: node test-api-key.js

const https = require('https');

// PASTE YOUR API KEY HERE (just for testing)
const API_KEY = 'AIzaSyDdKYcqpK0SLyVRAvmCSGF_lDb3EP2YotA';

const data = JSON.stringify({
  contents: [{
    parts: [{ text: 'Hello' }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing API key...');
console.log('API Key:', API_KEY.substring(0, 10) + '...');
console.log('');

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('');

    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! API key is valid!');
      console.log('Response:', body.substring(0, 200) + '...');
    } else {
      console.log('❌ FAILED! API key is invalid or restricted.');
      console.log('Error:', body);
      console.log('');
      console.log('💡 Fix:');
      console.log('1. Go to: https://aistudio.google.com/app/apikey');
      console.log('2. Create a NEW API key');
      console.log('3. Make sure "Generative Language API" is enabled');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network Error:', error);
});

req.write(data);
req.end();
