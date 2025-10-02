// Frontend Integration Fix Script
// Run this in browser console to clear stale authentication data

console.log('🔧 Clearing stale authentication data...');

// Clear all possible authentication storage keys
const keysToRemove = [
  'pesu_auth_user',
  'auth_token', 
  'user_id',
  'supabase.auth.token',
  'sb-iyrabfyteoyaaoctbvfh-auth-token'
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`❌ Removing stale data: ${key}`);
    localStorage.removeItem(key);
  }
});

// Clear any profile cache data
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('profile_data_')) {
    console.log(`❌ Removing stale profile cache: ${key}`);
    localStorage.removeItem(key);
  }
});

console.log('✅ Authentication data cleared! Please refresh the page and log in again.');
console.log('🎯 Expected user ID after login: 664793e8-9220-49bc-9c71-1ec8bcd412ed');