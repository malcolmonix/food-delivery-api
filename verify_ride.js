const { admin } = require('./firebase');

async function verifyRide() {
    const rideId = '1764984835806-xwjoy22qg'; // ID from screenshot
    const db = admin.firestore();

    console.log(`🔍 Checking for ride ${rideId}...`);

    // Check rides collection
    const rideRef = db.collection('rides').doc(rideId);
    const rideDoc = await rideRef.get();
    console.log(`Main 'rides' collection: ${rideDoc.exists ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (rideDoc.exists) console.log(rideDoc.data());

    // Check customer-rides collection
    const crRef = db.collection('customer-rides').doc(rideId);
    const crDoc = await crRef.get();
    console.log(`Backup 'customer-rides' collection: ${crDoc.exists ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (crDoc.exists) console.log(crDoc.data());

}

verifyRide().catch(console.error).finally(() => process.exit());
