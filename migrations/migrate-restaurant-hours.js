#!/usr/bin/env node

/**
 * Migration Script: Add Business Hours to Restaurants
 * 
 * This script adds business hours, timezone, and scheduling fields to:
 * 1. Supabase PostgreSQL database (if configured)
 * 2. Firestore database (always)
 * 
 * Usage:
 *   node api/migrations/migrate-restaurant-hours.js
 * 
 * Requirements: 1.1, 1.3, BR-1.1
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_TIMEZONE,
  DEFAULT_NOTIFICATIONS_SENT
} = require('../types/restaurant-hours');

/**
 * Migrate Supabase PostgreSQL database
 */
async function migrateSupabase() {
  console.log('\n📊 Migrating Supabase PostgreSQL database...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Supabase not configured, skipping PostgreSQL migration');
      return { success: true, skipped: true };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Read and execute the SQL migration file
    const migrationPath = path.join(__dirname, '002_add_restaurant_business_hours.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing SQL migration...');
    
    // Note: Supabase client doesn't support raw SQL execution directly
    // You'll need to run this migration manually in the Supabase SQL editor
    // or use a PostgreSQL client
    
    console.log('⚠️  Please run the following SQL migration manually in Supabase SQL editor:');
    console.log('   File: api/migrations/002_add_restaurant_business_hours.sql');
    console.log('\n   Or use the Supabase CLI:');
    console.log('   supabase db push');
    
    return { success: true, manual: true };
  } catch (error) {
    console.error('❌ Supabase migration error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Migrate Firestore database
 */
async function migrateFirestore() {
  console.log('\n🔥 Migrating Firestore database...');
  
  try {
    const { admin } = require('../firebase');
    const db = admin.firestore();
    
    // Get all restaurants
    const restaurantsSnapshot = await db.collection('restaurants').get();
    
    if (restaurantsSnapshot.empty) {
      console.log('ℹ️  No restaurants found in Firestore');
      return { success: true, updated: 0 };
    }
    
    console.log(`📋 Found ${restaurantsSnapshot.size} restaurants`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each restaurant
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    for (const doc of restaurantsSnapshot.docs) {
      const data = doc.data();
      
      // Check if restaurant already has business hours
      if (data.businessHours && data.timezone !== undefined) {
        skipped++;
        continue;
      }
      
      // Prepare update data
      const updateData = {};
      
      if (!data.businessHours) {
        updateData.businessHours = DEFAULT_BUSINESS_HOURS;
      }
      
      if (!data.timezone) {
        updateData.timezone = DEFAULT_TIMEZONE;
      }
      
      if (data.autoScheduleEnabled === undefined) {
        updateData.autoScheduleEnabled = false;
      }
      
      if (!data.lastManualStatusChange) {
        updateData.lastManualStatusChange = null;
      }
      
      if (!data.lastAutoStatusChange) {
        updateData.lastAutoStatusChange = null;
      }
      
      if (!data.notificationsSent) {
        updateData.notificationsSent = DEFAULT_NOTIFICATIONS_SENT;
      }
      
      // Add to batch
      batch.update(doc.ref, updateData);
      batchCount++;
      updated++;
      
      // Commit batch if it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`✅ Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\n📊 Firestore Migration Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    return { success: true, updated, skipped, errors };
  } catch (error) {
    console.error('❌ Firestore migration error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  try {
    const { admin } = require('../firebase');
    const db = admin.firestore();
    
    // Get a sample restaurant
    const snapshot = await db.collection('restaurants').limit(1).get();
    
    if (snapshot.empty) {
      console.log('⚠️  No restaurants to verify');
      return { success: true };
    }
    
    const restaurant = snapshot.docs[0].data();
    
    console.log('\n📋 Sample Restaurant Data:');
    console.log('   ID:', snapshot.docs[0].id);
    console.log('   Name:', restaurant.name);
    console.log('   Has businessHours:', !!restaurant.businessHours);
    console.log('   Has timezone:', !!restaurant.timezone);
    console.log('   autoScheduleEnabled:', restaurant.autoScheduleEnabled);
    
    if (restaurant.businessHours) {
      console.log('\n   Business Hours Sample:');
      console.log('   Monday:', JSON.stringify(restaurant.businessHours.monday));
      console.log('   Sunday:', JSON.stringify(restaurant.businessHours.sunday));
    }
    
    // Verify all required fields exist
    const requiredFields = [
      'businessHours',
      'timezone',
      'autoScheduleEnabled',
      'notificationsSent'
    ];
    
    const missingFields = requiredFields.filter(field => restaurant[field] === undefined);
    
    if (missingFields.length > 0) {
      console.log('\n❌ Missing fields:', missingFields.join(', '));
      return { success: false, missingFields };
    }
    
    console.log('\n✅ All required fields present');
    return { success: true };
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Restaurant Hours Migration Script');
  console.log('=====================================\n');
  
  try {
    // Migrate Supabase
    const supabaseResult = await migrateSupabase();
    
    // Migrate Firestore
    const firestoreResult = await migrateFirestore();
    
    // Verify migration
    const verifyResult = await verifyMigration();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    
    console.log('\nSupabase:');
    if (supabaseResult.skipped) {
      console.log('   ⏭️  Skipped (not configured)');
    } else if (supabaseResult.manual) {
      console.log('   ⚠️  Manual migration required');
    } else if (supabaseResult.success) {
      console.log('   ✅ Success');
    } else {
      console.log('   ❌ Failed:', supabaseResult.error);
    }
    
    console.log('\nFirestore:');
    if (firestoreResult.success) {
      console.log('   ✅ Success');
      console.log(`   📝 Updated ${firestoreResult.updated} restaurants`);
      console.log(`   ⏭️  Skipped ${firestoreResult.skipped} restaurants`);
    } else {
      console.log('   ❌ Failed:', firestoreResult.error);
    }
    
    console.log('\nVerification:');
    if (verifyResult.success) {
      console.log('   ✅ All checks passed');
    } else {
      console.log('   ❌ Verification failed');
      if (verifyResult.missingFields) {
        console.log('   Missing fields:', verifyResult.missingFields.join(', '));
      }
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (firestoreResult.success && verifyResult.success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. If using Supabase, run the SQL migration manually');
      console.log('2. Update GraphQL schema to include new fields');
      console.log('3. Deploy updated API');
      console.log('4. Test business hours configuration in MenuVerse');
      process.exit(0);
    } else {
      console.log('\n⚠️  Migration completed with warnings or errors');
      console.log('Please review the output above and fix any issues');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateSupabase, migrateFirestore, verifyMigration };
