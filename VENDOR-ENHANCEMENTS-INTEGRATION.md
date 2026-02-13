# Vendor Enhancements Integration Guide

## Overview
This document provides step-by-step instructions for integrating the vendor order management enhancements into the main `schema.js` file.

## Files Created
- `api/schema-vendor-enhancements.js` - Contains all new resolvers and helper functions

## Integration Steps

### Step 1: Add GraphQL Type Definitions

Add these to the `typeDefs` in `schema.js` (around line 200, after the existing Query type):

```graphql
type Query {
  # ... existing queries ...
  
  # NEW: Vendor order management
  restaurantOrders(restaurantId: ID!, status: String): [Order!]!
}

type Mutation {
  # ... existing mutations ...
  
  # NEW: Vendor order actions
  acceptOrder(orderId: ID!): Order!
  rejectOrder(orderId: ID!, reason: String!): Order!
}
```

### Step 2: Import the Enhancement Module

Add this import at the top of `schema.js` (around line 10):

```javascript
const {
  vendorResolvers,
  syncOrderToFirestore,
  dispatchToRider
} = require('./schema-vendor-enhancements');
```

### Step 3: Add Vendor Resolvers to Query

In the `resolvers.Query` object (around line 600), add:

```javascript
Query: {
  // ... existing queries ...
  
  // NEW: Vendor order management
  restaurantOrders: vendorResolvers.Query.restaurantOrders,
},
```

### Step 4: Add Vendor Resolvers to Mutation

In the `resolvers.Mutation` object (around line 1400), add:

```javascript
Mutation: {
  // ... existing mutations ...
  
  // NEW: Vendor order actions
  acceptOrder: vendorResolvers.Mutation.acceptOrder,
  rejectOrder: vendorResolvers.Mutation.rejectOrder,
},
```

### Step 5: Enhance updateOrderStatus with Firestore Sync

In the `updateOrderStatus` mutation (around line 1594), add Firestore sync after the database update:

```javascript
updateOrderStatus: async (_, { orderId, status, note }, { user }) => {
  // ... existing code ...
  
  // Update order in database
  dbHelpers.updateOrder(orderId, {
    orderStatus: status,
    statusHistory: updatedStatusHistory,
    updatedAt: new Date().toISOString(),
  });

  // NEW: Sync to Firestore for real-time updates
  await syncOrderToFirestore(orderId, dbHelpers);

  // NEW: Auto-dispatch when order marked as READY
  if (status === 'READY') {
    await dispatchToRider(orderId, dbHelpers);
  }

  // ... rest of existing code ...
},
```

### Step 6: Add State-Based Filtering to availableOrders

Update the `availableOrders` query (around line 750) to filter by rider's state:

```javascript
availableOrders: async (_, __, { user }) => {
  try {
    // Get rider's state from user profile
    let riderState = null;
    if (user) {
      const riderProfile = await dbHelpers.getUserByUid(user.uid);
      riderState = riderProfile?.state;
    }

    // Get all available orders
    const orders = await dbHelpers.getAvailableOrders();
    
    // Filter by state if rider has a state set
    let filteredOrders = orders;
    if (riderState) {
      filteredOrders = [];
      for (const order of orders) {
        const restaurant = await dbHelpers.getRestaurantById(order.restaurant);
        if (restaurant && restaurant.state === riderState) {
          filteredOrders.push(order);
        }
      }
      console.log(`🗺️ Filtered ${orders.length} orders to ${filteredOrders.length} in state: ${riderState}`);
    }
    
    return filteredOrders.map(order => ({
      ...order,
      orderItems: order.orderItems,
      statusHistory: order.statusHistory,
      isPickedUp: Boolean(order.isPickedUp),
      paymentProcessed: Boolean(order.paymentProcessed),
    }));
  } catch (error) {
    console.error('Error fetching available orders:', error);
    throw new Error('Failed to fetch available orders');
  }
},
```

### Step 7: Add State to Order Placement

Update the `placeOrder` mutation (around line 1457) to capture restaurant state:

```javascript
placeOrder: async (_, {
  restaurant,
  orderInput,
  // ... other params
}, { user }) => {
  // ... existing code ...

  // NEW: Get restaurant details to extract state
  let restaurantState = null;
  try {
    const restaurantDetails = await dbHelpers.getRestaurantById(restaurant);
    if (restaurantDetails) {
      restaurantState = restaurantDetails.state;
    }
  } catch (e) {
    console.warn('Could not fetch restaurant state:', e.message);
  }

  const orderData = {
    orderId,
    userId: user.uid,
    restaurant,
    restaurantState, // NEW: Store state for filtering
    // ... rest of order data
  };

  // ... rest of existing code ...
},
```

## Testing Checklist

After integration, test the following:

### Vendor Order Management
- [ ] Vendor can query `restaurantOrders` for their restaurant
- [ ] Vendor cannot query orders for other restaurants
- [ ] Vendor can filter orders by status
- [ ] Vendor can accept pending orders
- [ ] Vendor can reject orders with a reason
- [ ] Order status updates correctly in database

### Firestore Sync
- [ ] Order updates sync to main `orders` collection
- [ ] Order updates sync to `vendor-orders/{restaurantId}/orders/{orderId}`
- [ ] Order updates sync to `customer-orders/{userId}/orders/{orderId}`
- [ ] Order updates sync to `rider-orders/{riderId}/orders/{orderId}` (when rider assigned)
- [ ] Sync happens within 1 second of status change

### Auto-Dispatch
- [ ] When order marked as READY, dispatch triggers automatically
- [ ] System finds available riders in same state as restaurant
- [ ] System calculates distances correctly
- [ ] Nearest rider receives dispatch notification
- [ ] Delivery request created in Firestore
- [ ] Notification includes all required order details

### State-Based Filtering
- [ ] `availableOrders` query filters by rider's state
- [ ] Riders only see orders from restaurants in their state
- [ ] Orders without state are handled gracefully
- [ ] Riders without state see all orders (fallback)

### Notifications
- [ ] Customer receives notification when order accepted
- [ ] Customer receives notification when order rejected
- [ ] Rider receives dispatch notification with order details
- [ ] Notifications include deep links to order details

## Database Requirements

Ensure these columns exist in your database:

### restaurants table
- `state` (TEXT) - Restaurant's state/region

### users table
- `state` (TEXT) - User's state/region (for riders)

### orders table
- `restaurant_state` (TEXT) - Cached restaurant state for filtering

If these columns don't exist, run the migration:

```sql
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_state TEXT;
```

## Firestore Collections Required

Ensure these collections exist in Firestore:

- `orders` - Main orders collection
- `vendor-orders/{restaurantId}/orders` - Vendor-specific orders
- `customer-orders/{userId}/orders` - Customer-specific orders
- `rider-orders/{riderId}/orders` - Rider-specific orders
- `deliveryRequests` - Dispatch requests
- `riders` - Rider profiles with FCM tokens

## Environment Variables

Ensure these are set:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
```

## Deployment Notes

1. Deploy API changes first
2. Test with Postman/GraphQL Playground
3. Deploy frontend apps (MenuVerse, ChopChop, RiderMi)
4. Monitor error logs for Firestore sync issues
5. Check FCM notification delivery

## Rollback Plan

If issues occur:

1. Comment out the new resolver imports
2. Remove the new queries/mutations from typeDefs
3. Remove Firestore sync calls from updateOrderStatus
4. Redeploy API
5. Investigate and fix issues
6. Re-deploy with fixes

## Support

For issues or questions:
- Check API logs: `vercel logs food-delivery-api`
- Check Firestore console for sync status
- Check FCM console for notification delivery
- Review error tracking dashboard

---

**Last Updated**: February 7, 2026  
**Status**: Ready for Integration  
**Estimated Integration Time**: 30 minutes
