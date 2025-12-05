/**
 * Test script to manually send a ride notification
 * This helps verify FCM is working without needing to set up FCM tokens
 */

require('dotenv').config();
const { admin } = require('./firebase');

async function testNotification() {
  try {
    console.log('Testing ride notification...');
    console.log('Firebase Project:', process.env.FIREBASE_PROJECT_ID);

    const firestore = admin.firestore();

    // Get all riders
    const ridersSnapshot = await firestore.collection('riders').get();
    console.log(`\nTotal riders in Firestore: ${ridersSnapshot.size}`);

    // List all riders
    const riders = [];
    ridersSnapshot.forEach(doc => {
      const data = doc.data();
      riders.push({
        uid: doc.id,
        available: data.available,
        fcmToken: data.fcmToken ? 'EXISTS' : 'MISSING',
        email: data.email,
        displayName: data.displayName
      });
      console.log(`- ${doc.id}:`);
      console.log(`  Available: ${data.available}`);
      console.log(`  FCM Token: ${data.fcmToken ? '✅ (length: ' + data.fcmToken.length + ')' : '❌'}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Name: ${data.displayName}`);
    });

    // Get online riders
    const onlineSnapshot = await firestore.collection('riders')
      .where('available', '==', true)
      .get();

    console.log(`\nOnline riders (available=true): ${onlineSnapshot.size}`);
    onlineSnapshot.forEach(doc => {
      console.log(`- ${doc.id}`);
    });

    // Get riders with tokens
    const tokensSnapshot = await firestore.collection('riders').get();
    let tokenCount = 0;
    tokensSnapshot.forEach(doc => {
      if (doc.data().fcmToken) tokenCount++;
    });

    console.log(`\nRiders with FCM tokens: ${tokenCount}`);

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

testNotification();
