const { dbHelpers } = require('./database.memory');

async function testActiveRide() {
    console.log('🧪 Testing getActiveRideForCustomer...');

    try {
        // 1. Create a user
        const user = await dbHelpers.createUser({
            email: 'test-rider-active@example.com',
            displayName: 'Test User'
        });
        console.log('Created user:', user.id);

        // 2. Verify no active ride initially
        const noRide = await dbHelpers.getActiveRideForCustomer(user.id);
        if (noRide === null) {
            console.log('✅ Correctly returned null for no active ride');
        } else {
            console.error('❌ Expected null, got:', noRide);
        }

        // 3. Create an active ride
        const rideId = await dbHelpers.createRide({
            userId: user.id,
            pickupAddress: '123 Test St',
            dropoffAddress: '456 Test Ave',
            status: 'REQUESTED'
        });
        console.log('Created active ride:', rideId);

        // 4. Verify getting the active ride
        const activeRide = await dbHelpers.getActiveRideForCustomer(user.id);
        if (activeRide && activeRide.id === rideId) {
            console.log('✅ Correctly returned active ride:', activeRide.id);
        } else {
            console.error('❌ Failed to get active ride. Got:', activeRide);
        }

        // 5. Complete the ride
        await dbHelpers.updateRideStatus(rideId, 'COMPLETED');
        console.log('Completed ride');

        // 6. Verify no active ride again
        const completedRide = await dbHelpers.getActiveRideForCustomer(user.id);
        if (completedRide === null) {
            console.log('✅ Correctly returned null after completion');
        } else {
            console.error('❌ Expected null for completed ride, got:', completedRide);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testActiveRide();
