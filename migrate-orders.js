// Migration script to backfill customer-orders collection and customerId field
// Run this once to make existing orders work with the new sync system

require('dotenv').config();
const { admin, db } = require('./firebase');

async function migrateOrders() {
  console.log('🔄 Starting order migration...\n');
  
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Get all vendor collections
    const eateriesSnapshot = await db.collection('eateries').get();
    
    for (const eateryDoc of eateriesSnapshot.docs) {
      const vendorId = eateryDoc.id;
      console.log(`\n📍 Processing vendor: ${vendorId}`);
      
      // Get all orders for this vendor
      const ordersSnapshot = await db.collection('eateries').doc(vendorId).collection('orders').get();
      
      console.log(`  Found ${ordersSnapshot.size} orders`);
      
      for (const orderDoc of ordersSnapshot.docs) {
        const orderId = orderDoc.id;
        const orderData = orderDoc.data();
        
        try {
          // Check if customer-orders record already exists
          const customerOrderRef = db.collection('customer-orders').doc(orderId);
          const customerOrderSnap = await customerOrderRef.get();
          
          if (customerOrderSnap.exists) {
            console.log(`  ⏭️  Skipped ${orderId} (already migrated)`);
            skippedCount++;
            continue;
          }
          
          // Extract customer info
          const customer = orderData.customer || {};
          let customerId = orderData.customerId || customer.uid || orderData.userId || orderData.uid;
          
          // If no customerId but we have email, try to look up the user
          if (!customerId && customer.email) {
            try {
              console.log(`  🔍 Looking up user by email: ${customer.email}`);
              const userRecord = await admin.auth().getUserByEmail(customer.email);
              customerId = userRecord.uid;
              console.log(`  ✅ Found user ID: ${customerId}`);
            } catch (lookupError) {
              console.log(`  ⚠️  Could not find Firebase user for email ${customer.email}: ${lookupError.message}`);
            }
          }
          
          if (!customerId) {
            console.log(`  ⚠️  Skipped ${orderId} (no way to identify customer)`);
            skippedCount++;
            continue;
          }
          
          // Prepare customer order data
          const customerOrderData = {
            orderId: orderId,
            customerId: customerId,
            restaurantId: vendorId,
            restaurantName: orderData.eateryName || orderData.restaurantName || 'Restaurant',
            orderStatus: orderData.status || 'Pending',
            orderAmount: orderData.totalAmount || orderData.orderAmount || 0,
            paidAmount: orderData.totalAmount || orderData.paidAmount || 0,
            orderItems: orderData.items || orderData.orderItems || [],
            orderDate: orderData.createdAt || admin.firestore.Timestamp.now(),
            createdAt: orderData.createdAt || admin.firestore.Timestamp.now(),
            updatedAt: orderData.updatedAt || admin.firestore.Timestamp.now(),
            customer: {
              name: customer.name || 'Customer',
              email: customer.email || '',
              phone: customer.phone || '',
              address: customer.address || orderData.deliveryAddress || ''
            },
            paymentMethod: orderData.paymentMethod || 'CASH',
            statusHistory: orderData.statusHistory || [
              {
                status: orderData.status || 'Pending',
                timestamp: orderData.createdAt || admin.firestore.Timestamp.now(),
                note: 'Migrated from existing order'
              }
            ]
          };
          
          // Create customer-orders record
          await customerOrderRef.set(customerOrderData);
          
          // Update vendor order with customerId if missing
          if (!orderData.customerId) {
            await db.collection('eateries').doc(vendorId).collection('orders').doc(orderId).update({
              customerId: customerId,
              updatedAt: admin.firestore.Timestamp.now()
            });
          }
          
          console.log(`  ✅ Migrated ${orderId} for customer ${customerId}`);
          migratedCount++;
          
        } catch (error) {
          console.error(`  ❌ Error migrating ${orderId}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run migration
migrateOrders();
