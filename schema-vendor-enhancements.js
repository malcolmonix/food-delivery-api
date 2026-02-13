/**
 * Vendor Order Management Enhancements
 * Week 1, Days 2-3: Complete Order Fulfillment Workflow
 * 
 * This file contains the vendor-specific queries and mutations
 * to be integrated into the main schema.js file.
 */

const { admin } = require('./firebase');

/**
 * PRIORITY 1: VENDOR ORDER MANAGEMENT
 * 
 * These resolvers enable vendors to:
 * - View their restaurant's orders
 * - Accept orders
 * - Reject orders with reasons
 */

const vendorResolvers = {
  Query: {
    /**
     * Get orders for a specific restaurant
     * Filters by restaurantId and optionally by status
     * Only accessible by the restaurant owner
     */
    restaurantOrders: async (_, { restaurantId, status }, { user, dbHelpers }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify user owns this restaurant
        const restaurant = await dbHelpers.getRestaurantById(restaurantId);
        if (!restaurant) {
          throw new Error('Restaurant not found');
        }
        
        if (restaurant.ownerId !== user.uid) {
          throw new Error('Access denied: Can only view orders for your own restaurant');
        }

        // Get all orders for this restaurant
        const { data, error } = await dbHelpers.supabase
          .from('orders')
          .select('*')
          .eq('restaurant', restaurantId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching restaurant orders:', error);
          throw new Error('Failed to fetch orders');
        }

        let orders = data || [];

        // Filter by status if provided
        if (status) {
          orders = orders.filter(order => order.order_status === status);
        }

        // Map to GraphQL format
        return orders.map(order => ({
          ...order,
          orderId: order.order_id,
          userId: order.user_id,
          riderId: order.rider_id,
          orderItems: order.order_items, // Already JSONB
          orderAmount: order.order_amount,
          paidAmount: order.paid_amount,
          paymentMethod: order.payment_method,
          orderStatus: order.order_status,
          orderDate: order.order_date,
          expectedTime: order.expected_time,
          isPickedUp: order.is_picked_up,
          pickupCode: order.pickup_code,
          paymentProcessed: order.payment_processed,
          deliveryCharges: order.delivery_charges,
          tipping: order.tipping,
          taxationAmount: order.taxation_amount,
          couponCode: order.coupon_code,
          statusHistory: order.status_history, // Already JSONB
          customer: order.customer_info,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        }));
      } catch (error) {
        console.error('Error in restaurantOrders:', error);
        throw error;
      }
    },
  },

  Mutation: {
    /**
     * Accept an order (vendor action)
     * Updates status to CONFIRMED and syncs to Firestore
     */
    acceptOrder: async (_, { orderId }, { user, dbHelpers }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Get the order
        const order = await dbHelpers.getOrderById(orderId);
        if (!order) {
          throw new Error('Order not found');
        }

        // Verify user owns the restaurant
        const restaurant = await dbHelpers.getRestaurantById(order.restaurant);
        if (!restaurant || restaurant.ownerId !== user.uid) {
          throw new Error('Access denied: Can only accept orders for your own restaurant');
        }

        // Check if order can be accepted
        if (order.orderStatus !== 'PENDING' && order.orderStatus !== 'PENDING_PAYMENT') {
          throw new Error(`Cannot accept order with status: ${order.orderStatus}`);
        }

        // Update order status
        const statusUpdate = {
          status: 'CONFIRMED',
          timestamp: new Date().toISOString(),
          note: 'Order accepted by vendor'
        };

        const updatedStatusHistory = [...order.statusHistory, statusUpdate];

        await dbHelpers.updateOrder(orderId, {
          orderStatus: 'CONFIRMED',
          statusHistory: updatedStatusHistory,
          updatedAt: new Date().toISOString()
        });

        console.log(`✅ Order ${orderId} accepted by vendor`);

        // Sync to Firestore for real-time updates
        await syncOrderToFirestore(orderId, dbHelpers);

        // Send notification to customer
        await sendOrderNotification(order.userId, {
          title: 'Order Accepted',
          body: `${restaurant.name} has accepted your order`,
          orderId: orderId,
          status: 'CONFIRMED'
        });

        // Return updated order
        const updatedOrder = await dbHelpers.getOrderById(orderId);
        return {
          ...updatedOrder,
          orderItems: updatedOrder.orderItems,
          statusHistory: updatedOrder.statusHistory,
          isPickedUp: Boolean(updatedOrder.isPickedUp),
        };
      } catch (error) {
        console.error('Error accepting order:', error);
        throw error;
      }
    },

    /**
     * Reject an order (vendor action)
     * Updates status to CANCELLED with reason
     */
    rejectOrder: async (_, { orderId, reason }, { user, dbHelpers }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Get the order
        const order = await dbHelpers.getOrderById(orderId);
        if (!order) {
          throw new Error('Order not found');
        }

        // Verify user owns the restaurant
        const restaurant = await dbHelpers.getRestaurantById(order.restaurant);
        if (!restaurant || restaurant.ownerId !== user.uid) {
          throw new Error('Access denied: Can only reject orders for your own restaurant');
        }

        // Check if order can be rejected
        if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
          throw new Error(`Cannot reject order with status: ${order.orderStatus}`);
        }

        // Update order status
        const statusUpdate = {
          status: 'CANCELLED',
          timestamp: new Date().toISOString(),
          note: `Order rejected by vendor: ${reason}`
        };

        const updatedStatusHistory = [...order.statusHistory, statusUpdate];

        await dbHelpers.updateOrder(orderId, {
          orderStatus: 'CANCELLED',
          statusHistory: updatedStatusHistory,
          updatedAt: new Date().toISOString()
        });

        console.log(`❌ Order ${orderId} rejected by vendor: ${reason}`);

        // Sync to Firestore for real-time updates
        await syncOrderToFirestore(orderId, dbHelpers);

        // Send notification to customer
        await sendOrderNotification(order.userId, {
          title: 'Order Cancelled',
          body: `${restaurant.name} has cancelled your order: ${reason}`,
          orderId: orderId,
          status: 'CANCELLED'
        });

        // TODO: Process refund if payment was already processed

        // Return updated order
        const updatedOrder = await dbHelpers.getOrderById(orderId);
        return {
          ...updatedOrder,
          orderItems: updatedOrder.orderItems,
          statusHistory: updatedOrder.statusHistory,
          isPickedUp: Boolean(updatedOrder.isPickedUp),
        };
      } catch (error) {
        console.error('Error rejecting order:', error);
        throw error;
      }
    },
  },
};

/**
 * PRIORITY 2: FIRESTORE SYNC HELPER
 * 
 * Syncs order data to Firestore for real-time updates across all apps
 */
async function syncOrderToFirestore(orderId, dbHelpers) {
  try {
    if (!admin || !admin.firestore) {
      console.warn('⚠️ Firestore not available, skipping sync');
      return;
    }

    const firestore = admin.firestore();
    const order = await dbHelpers.getOrderById(orderId);
    
    if (!order) {
      console.warn(`⚠️ Order ${orderId} not found, skipping Firestore sync`);
      return;
    }

    console.log(`📦 Order data for sync:`, {
      orderId: order.orderId,
      userId: order.userId,
      restaurant: order.restaurant,
      orderStatus: order.orderStatus
    });

    // Prepare order data for Firestore
    const firestoreData = {
      orderId: order.orderId || orderId.toString(),
      userId: order.userId,
      restaurant: order.restaurant,
      riderId: order.riderId || null,
      orderStatus: order.orderStatus,
      orderAmount: order.orderAmount,
      deliveryCharges: order.deliveryCharges,
      address: order.address,
      orderItems: order.orderItems,
      statusHistory: order.statusHistory,
      customer: order.customer,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Convert orderId to string for Firestore document ID
    const orderIdStr = orderId.toString();

    // 1. Sync to main orders collection
    await firestore.collection('orders').doc(orderIdStr).set(firestoreData, { merge: true });
    console.log(`✅ Synced order ${orderIdStr} to Firestore orders collection`);

    // 2. Sync to vendor-orders subcollection
    if (order.restaurant) {
      await firestore
        .collection('vendor-orders')
        .doc(order.restaurant)
        .collection('orders')
        .doc(orderIdStr)
        .set(firestoreData, { merge: true });
      console.log(`✅ Synced order ${orderIdStr} to vendor-orders/${order.restaurant}`);
    } else {
      console.warn(`⚠️ Order ${orderIdStr} has no restaurant, skipping vendor-orders sync`);
    }

    // 3. Sync to customer-orders subcollection
    if (order.userId) {
      await firestore
        .collection('customer-orders')
        .doc(order.userId)
        .collection('orders')
        .doc(orderIdStr)
        .set(firestoreData, { merge: true });
      console.log(`✅ Synced order ${orderIdStr} to customer-orders/${order.userId}`);
    } else {
      console.warn(`⚠️ Order ${orderIdStr} has no userId, skipping customer-orders sync`);
    }

    // 4. Sync to rider-orders subcollection (if rider assigned)
    if (order.riderId) {
      await firestore
        .collection('rider-orders')
        .doc(order.riderId)
        .collection('orders')
        .doc(orderIdStr)
        .set(firestoreData, { merge: true });
      console.log(`✅ Synced order ${orderIdStr} to rider-orders/${order.riderId}`);
    }

  } catch (error) {
    console.error('❌ Error syncing order to Firestore:', error);
    // Don't throw - we don't want Firestore sync failures to break the mutation
  }
}

/**
 * PRIORITY 3: AUTO-DISPATCH SYSTEM
 * 
 * Automatically dispatches orders to nearest available rider when marked as READY
 */
async function dispatchToRider(orderId, dbHelpers) {
  try {
    console.log(`🚀 Starting auto-dispatch for order ${orderId}`);

    const order = await dbHelpers.getOrderById(orderId);
    if (!order) {
      console.error(`❌ Order ${orderId} not found`);
      return;
    }

    const restaurant = await dbHelpers.getRestaurantById(order.restaurant);
    if (!restaurant) {
      console.error(`❌ Restaurant ${order.restaurant} not found`);
      return;
    }

    // Get restaurant state for filtering
    const restaurantState = restaurant.state;
    if (!restaurantState) {
      console.warn(`⚠️ Restaurant ${restaurant.id} has no state set, cannot dispatch`);
      return;
    }

    console.log(`📍 Restaurant state: ${restaurantState}`);

    // Find available riders in the same state
    if (!admin || !admin.firestore) {
      console.warn('⚠️ Firestore not available, cannot dispatch');
      return;
    }

    const firestore = admin.firestore();
    const ridersSnapshot = await firestore
      .collection('riders')
      .where('state', '==', restaurantState)
      .where('available', '==', true)
      .where('isOnline', '==', true)
      .get();

    if (ridersSnapshot.empty) {
      console.warn(`⚠️ No available riders in ${restaurantState}`);
      // TODO: Notify admin
      return;
    }

    console.log(`👥 Found ${ridersSnapshot.size} available riders in ${restaurantState}`);

    // Calculate distances and find nearest rider
    const ridersWithDistance = [];
    
    for (const doc of ridersSnapshot.docs) {
      const rider = doc.data();
      
      if (!rider.latitude || !rider.longitude || !restaurant.latitude || !restaurant.longitude) {
        continue;
      }

      const distance = calculateDistance(
        restaurant.latitude,
        restaurant.longitude,
        rider.latitude,
        rider.longitude
      );

      ridersWithDistance.push({
        riderId: doc.id,
        ...rider,
        distance
      });
    }

    if (ridersWithDistance.length === 0) {
      console.warn('⚠️ No riders with valid locations found');
      return;
    }

    // Sort by distance (nearest first)
    ridersWithDistance.sort((a, b) => a.distance - b.distance);
    const nearestRider = ridersWithDistance[0];

    console.log(`🎯 Nearest rider: ${nearestRider.riderId} (${nearestRider.distance.toFixed(2)} km away)`);

    // Send dispatch notification to nearest rider
    await sendDispatchNotification(nearestRider.riderId, {
      orderId: order.id,
      restaurantName: restaurant.name,
      pickupAddress: restaurant.address,
      deliveryAddress: order.address,
      deliveryFee: order.deliveryCharges || 2000,
      estimatedPickupTime: 10, // minutes
      orderValue: order.orderAmount,
      distance: nearestRider.distance
    });

    // Create delivery request in Firestore
    await firestore.collection('deliveryRequests').add({
      orderId: order.id,
      riderId: nearestRider.riderId,
      restaurantId: restaurant.id,
      status: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 60000) // 1 minute to accept
    });

    console.log(`✅ Dispatch notification sent to rider ${nearestRider.riderId}`);

  } catch (error) {
    console.error('❌ Error dispatching to rider:', error);
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Send push notification to customer
 */
async function sendOrderNotification(userId, { title, body, orderId, status }) {
  try {
    if (!admin || !admin.messaging || !admin.firestore) {
      console.warn('⚠️ Firebase not available, skipping notification');
      return;
    }

    const firestore = admin.firestore();
    
    // Get user's FCM token
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists || !userDoc.data().fcmToken) {
      console.warn(`⚠️ No FCM token for user ${userId}`);
      return;
    }

    const fcmToken = userDoc.data().fcmToken;

    // Send notification
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'ORDER_UPDATE',
        orderId: orderId.toString(),
        status
      }
    });

    console.log(`✅ Notification sent to user ${userId}`);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

/**
 * Send dispatch notification to rider
 */
async function sendDispatchNotification(riderId, orderDetails) {
  try {
    if (!admin || !admin.messaging || !admin.firestore) {
      console.warn('⚠️ Firebase not available, skipping dispatch notification');
      return;
    }

    const firestore = admin.firestore();
    
    // Get rider's FCM token
    const riderDoc = await firestore.collection('riders').doc(riderId).get();
    if (!riderDoc.exists || !riderDoc.data().fcmToken) {
      console.warn(`⚠️ No FCM token for rider ${riderId}`);
      return;
    }

    const fcmToken = riderDoc.data().fcmToken;

    // Send notification
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'New Delivery Available',
        body: `${orderDetails.restaurantName} - ₦${orderDetails.deliveryFee} (${orderDetails.distance.toFixed(1)} km away)`
      },
      data: {
        type: 'DELIVERY_DISPATCH',
        orderId: orderDetails.orderId.toString(),
        restaurantName: orderDetails.restaurantName,
        pickupAddress: orderDetails.pickupAddress,
        deliveryAddress: orderDetails.deliveryAddress,
        deliveryFee: orderDetails.deliveryFee.toString(),
        estimatedPickupTime: orderDetails.estimatedPickupTime.toString(),
        orderValue: orderDetails.orderValue.toString(),
        distance: orderDetails.distance.toString()
      }
    });

    console.log(`✅ Dispatch notification sent to rider ${riderId}`);
  } catch (error) {
    console.error('❌ Error sending dispatch notification:', error);
  }
}

module.exports = {
  vendorResolvers,
  syncOrderToFirestore,
  dispatchToRider,
  calculateDistance,
  sendOrderNotification,
  sendDispatchNotification
};
