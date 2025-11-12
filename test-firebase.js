const { db } = require('./firebase');

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');

    // Try to get a collection reference
    const ordersRef = db.collection('orders');
    console.log('✅ Firebase collection reference created');

    // Try to get documents
    const snapshot = await ordersRef.limit(1).get();
    console.log('✅ Firebase query successful, documents found:', snapshot.size);

    // Try to add a test document
    const testDoc = await ordersRef.add({
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Firebase write successful, document ID:', testDoc.id);

    // Clean up test document
    await testDoc.delete();
    console.log('✅ Firebase delete successful');

    console.log('🎉 All Firebase tests passed!');

  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('Error details:', error);
  }
}

testFirebase();