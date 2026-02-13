/**
 * Fix rider user_type in Supabase
 * Sets user_type='rider' for users who are actually riders
 * Run: node fix-rider-user-types.js
 */

require('dotenv').config({ path: '.env.local' });
const { supabase } = require('./supabase');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function fixRiderUserTypes() {
  console.log('\n🔧 Fixing Rider User Types in Supabase\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get all riders from Firestore
    console.log('\n1️⃣  Fetching riders from Firestore...');
    const firestore = admin.firestore();
    const ridersSnapshot = await firestore.collection('riders').get();
    
    console.log(`📊 Found ${ridersSnapshot.size} riders in Firestore`);
    
    if (ridersSnapshot.empty) {
      console.log('⚠️  No riders found in Firestore');
      return;
    }
    
    // Step 2: Get rider UIDs
    const riderUids = [];
    ridersSnapshot.forEach(doc => {
      riderUids.push(doc.id);
    });
    
    console.log(`\n🏍️  Rider UIDs: ${riderUids.join(', ')}`);
    
    // Step 3: Update Supabase users table
    console.log('\n2️⃣  Updating Supabase users table...');
    
    let updated = 0;
    let errors = 0;
    
    for (const uid of riderUids) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ user_type: 'rider' })
          .eq('uid', uid)
          .select();
        
        if (error) {
          console.error(`  ❌ Error updating ${uid}:`, error.message);
          errors++;
        } else if (data && data.length > 0) {
          console.log(`  ✅ Updated ${uid} to user_type='rider'`);
          updated++;
        } else {
          console.log(`  ⚠️  User ${uid} not found in Supabase`);
        }
      } catch (err) {
        console.error(`  ❌ Exception updating ${uid}:`, err.message);
        errors++;
      }
    }
    
    // Step 4: Verify the updates
    console.log('\n3️⃣  Verifying updates...');
    const { data: riders, error: verifyError } = await supabase
      .from('users')
      .select('uid, email, display_name, user_type, is_online')
      .eq('user_type', 'rider');
    
    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
    } else {
      console.log(`\n📊 Riders in Supabase after update: ${riders.length}`);
      riders.forEach(rider => {
        console.log(`  - ${rider.display_name || rider.email} (${rider.uid})`);
        console.log(`    user_type: ${rider.user_type}, is_online: ${rider.is_online}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Fix Complete\n');
    console.log(`📊 Summary:`);
    console.log(`   Riders found in Firestore: ${riderUids.length}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    console.error(error.stack);
  }
}

fixRiderUserTypes();
