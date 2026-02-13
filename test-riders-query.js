/**
 * Test script to debug riders query
 * Run from api directory: node test-riders-query.js
 */

require('dotenv').config({ path: '.env.local' });
const { dbHelpers } = require('./database.supabase');

async function testRidersQuery() {
  console.log('\n🚀 Testing Riders Query\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Check if getAllUsers exists
    console.log('\n1️⃣  Checking if getAllUsers function exists...');
    if (typeof dbHelpers.getAllUsers === 'function') {
      console.log('✅ getAllUsers function exists');
    } else {
      console.log('❌ getAllUsers function NOT found');
      return;
    }
    
    // Test 2: Get all users
    console.log('\n2️⃣  Fetching all users from Supabase...');
    const allUsers = await dbHelpers.getAllUsers();
    console.log(`📊 Total users: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\n📋 Sample user structure:');
      const sampleUser = allUsers[0];
      console.log(JSON.stringify(sampleUser, null, 2));
    }
    
    // Test 3: Filter for riders
    console.log('\n3️⃣  Filtering for riders (userType === "rider")...');
    const riders = allUsers.filter(u => u.userType === 'rider');
    console.log(`🏍️  Total riders: ${riders.length}`);
    
    if (riders.length > 0) {
      console.log('\n📋 Rider details:');
      riders.forEach((rider, index) => {
        console.log(`\n  Rider ${index + 1}:`);
        console.log(`    uid: ${rider.uid}`);
        console.log(`    email: ${rider.email}`);
        console.log(`    displayName: ${rider.displayName}`);
        console.log(`    userType: ${rider.userType}`);
        console.log(`    isOnline: ${rider.isOnline}`);
        console.log(`    updatedAt: ${rider.updatedAt}`);
      });
    } else {
      console.log('\n⚠️  No riders found with userType === "rider"');
      console.log('\n🔍 Checking user_type values in database:');
      const userTypes = [...new Set(allUsers.map(u => u.userType))];
      console.log(`   Found user types: ${userTypes.join(', ')}`);
    }
    
    // Test 4: Filter for online riders
    console.log('\n4️⃣  Filtering for online riders...');
    const onlineRiders = riders.filter(r => r.isOnline === true);
    console.log(`✅ Online riders: ${onlineRiders.length}`);
    
    if (onlineRiders.length > 0) {
      console.log('\n📋 Online rider details:');
      onlineRiders.forEach((rider, index) => {
        console.log(`\n  Online Rider ${index + 1}:`);
        console.log(`    uid: ${rider.uid}`);
        console.log(`    displayName: ${rider.displayName}`);
        console.log(`    isOnline: ${rider.isOnline}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test Complete\n');
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   Total riders: ${riders.length}`);
    console.log(`   Online riders: ${onlineRiders.length}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
    console.error(error.stack);
  }
}

testRidersQuery();
