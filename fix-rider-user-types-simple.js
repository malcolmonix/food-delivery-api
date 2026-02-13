/**
 * Simple fix for rider user_type in Supabase
 * Manually specify rider UIDs to update
 * Run: node fix-rider-user-types-simple.js
 */

require('dotenv').config({ path: '.env.local' });
const { supabase } = require('./supabase');

// MANUALLY ADD RIDER UIDs HERE
// Get these from RiderMi app or Firebase console
const RIDER_UIDS = [
  '0GI3MojVnLfvzSEqMc25oCzAmCz2',  // Malcolm Etuk (Onix)
];

async function fixRiderUserTypes() {
  console.log('\n🔧 Fixing Rider User Types in Supabase\n');
  console.log('='.repeat(60));
  
  // If no UIDs specified, try to find users who might be riders
  if (RIDER_UIDS.length === 0) {
    console.log('\n⚠️  No rider UIDs specified. Checking for potential riders...\n');
    
    // Get all users
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('uid, email, display_name, user_type, is_online, updated_at');
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log(`📊 Total users in database: ${allUsers.length}\n`);
    console.log('Users:');
    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.display_name || user.email} (${user.uid})`);
      console.log(`   user_type: ${user.user_type || 'NULL'}`);
      console.log(`   is_online: ${user.is_online}`);
      console.log('');
    });
    
    console.log('\n📝 To fix rider user types:');
    console.log('1. Identify which users are riders');
    console.log('2. Add their UIDs to the RIDER_UIDS array in this script');
    console.log('3. Run the script again\n');
    return;
  }
  
  console.log(`\n🏍️  Updating ${RIDER_UIDS.length} riders...\n`);
  
  let updated = 0;
  let errors = 0;
  
  for (const uid of RIDER_UIDS) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ user_type: 'rider' })
        .eq('uid', uid)
        .select();
      
      if (error) {
        console.error(`❌ Error updating ${uid}:`, error.message);
        errors++;
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${data[0].display_name || data[0].email} (${uid}) to user_type='rider'`);
        updated++;
      } else {
        console.log(`⚠️  User ${uid} not found in Supabase`);
      }
    } catch (err) {
      console.error(`❌ Exception updating ${uid}:`, err.message);
      errors++;
    }
  }
  
  // Verify
  console.log('\n📊 Verifying riders in database...\n');
  const { data: riders, error: verifyError } = await supabase
    .from('users')
    .select('uid, email, display_name, user_type, is_online')
    .eq('user_type', 'rider');
  
  if (verifyError) {
    console.error('❌ Error verifying:', verifyError);
  } else {
    console.log(`✅ Total riders in database: ${riders.length}\n`);
    riders.forEach(rider => {
      console.log(`  - ${rider.display_name || rider.email} (${rider.uid})`);
      console.log(`    is_online: ${rider.is_online}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Fix Complete\n');
  console.log(`📊 Summary:`);
  console.log(`   Riders to update: ${RIDER_UIDS.length}`);
  console.log(`   Successfully updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log('');
}

fixRiderUserTypes();
