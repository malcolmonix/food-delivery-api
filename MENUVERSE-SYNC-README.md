# MenuVerse Order Status Sync

This feature enables real-time order status synchronization between MenuVerse (vendor platform) and ChopChop (customer platform).

## 🎯 Overview

When a vendor updates an order status in MenuVerse, ChopChop customers can see the updates in real-time through three methods:

1. **Webhooks** (Real-time) - MenuVerse pushes updates to ChopChop
2. **Manual Sync** - Users can manually sync their orders
3. **Bulk Sync** - Sync all orders for a user at once

## 🚀 Quick Start

### 1. Place an Order with MenuVerse Integration

```graphql
mutation PlaceOrder {
  placeOrder(
    restaurant: "Restaurant Name"
    orderInput: [
      {
        title: "Burger"
        food: "burger-001"
        description: "Classic beef burger"
        quantity: 1
        price: 15.99
        total: 15.99
      }
    ]
    paymentMethod: "CASH"
    orderDate: "2025-11-05T10:00:00Z"
    address: "123 Main St, City"
    menuVerseVendorId: "vendor-id-from-menuverse"
  ) {
    id
    orderId
    orderStatus
    menuVerseVendorId
    menuVerseOrderId
  }
}
```

### 2. Sync Order from MenuVerse

```graphql
mutation SyncOrder {
  syncOrderFromMenuVerse(
    orderId: "order-id"
    vendorId: "vendor-id"
  ) {
    id
    orderStatus
    lastSyncedAt
    riderInfo {
      name
      phone
      vehicle
      plateNumber
    }
  }
}
```

### 3. Webhook (Called by MenuVerse)

```graphql
mutation WebhookUpdate {
  webhookMenuVerseOrderUpdate(
    orderId: "order-id"
    status: "CONFIRMED"
    restaurantId: "vendor-id"
    restaurantName: "Restaurant Name"
    riderInfo: {
      name: "John Doe"
      phone: "+234-123-456-7890"
      vehicle: "Motorcycle"
      plateNumber: "ABC-123"
    }
  ) {
    id
    orderStatus
    riderInfo {
      name
      phone
    }
  }
}
```

### 4. Bulk Sync All Orders

```graphql
mutation BulkSync {
  syncAllOrdersFromMenuVerse(
    userId: "user-id"
    limit: 10
  ) {
    id
    orderId
    orderStatus
    lastSyncedAt
  }
}
```

## 📊 Status Mapping

MenuVerse statuses are automatically mapped to ChopChop statuses:

| MenuVerse Status | ChopChop Status |
|------------------|-----------------|
| PENDING          | PENDING_PAYMENT |
| PENDING_PAYMENT  | PENDING_PAYMENT |
| CONFIRMED        | CONFIRMED       |
| PROCESSING       | PROCESSING      |
| READY            | READY           |
| OUT_FOR_DELIVERY | OUT_FOR_DELIVERY|
| DELIVERED        | DELIVERED       |
| CANCELLED        | CANCELLED       |

## 🧪 Testing

### Run the test suite:

```bash
# Start the server
npm start

# In another terminal, run the sync tests
npm run test:sync
```

The test suite will:
1. ✅ Place an order with MenuVerse integration
2. ✅ Sync order from MenuVerse
3. ✅ Simulate a webhook status update
4. ✅ Perform bulk sync
5. ✅ Query and verify order status

## 🔐 Environment Variables

Make sure you have the secondary Firebase configured for MenuVerse:

```env
# Primary Firebase (ChopChop)
FIREBASE_PROJECT_ID=chopchop-67750
FIREBASE_PRIVATE_KEY=your-chopchop-key
FIREBASE_CLIENT_EMAIL=your-chopchop-email

# Secondary Firebase (MenuVerse) - Optional but required for sync
SECONDARY_FIREBASE_PROJECT_ID=chopchop-67750
SECONDARY_FIREBASE_PRIVATE_KEY=your-menuverse-key
SECONDARY_FIREBASE_CLIENT_EMAIL=your-menuverse-email
```

## 📝 Order Fields

Orders now include these MenuVerse-specific fields:

```typescript
type Order {
  // ... existing fields ...
  
  // MenuVerse Integration
  menuVerseVendorId: String      // Vendor ID in MenuVerse
  menuVerseOrderId: String        // Order ID in MenuVerse
  lastSyncedAt: String            // Last sync timestamp
  
  // Rider Information (from MenuVerse)
  riderInfo: {
    name: String
    phone: String
    vehicle: String
    plateNumber: String
  }
}
```

## 🔄 Real-time Updates

Orders automatically publish to GraphQL subscriptions when status changes:

```graphql
subscription OrderUpdates {
  orderStatusUpdated(orderId: "order-id") {
    id
    orderStatus
    riderInfo {
      name
      phone
    }
  }
}
```

## 🐛 Troubleshooting

### Sync fails with "MenuVerse integration not configured"
- Ensure `SECONDARY_FIREBASE_*` environment variables are set
- Verify the secondary Firebase credentials are valid

### Order not found in MenuVerse
- Check that `menuVerseVendorId` is correctly set when placing the order
- Verify the order exists in MenuVerse database
- Ensure the vendor ID matches between systems

### Webhook not working
- Verify the webhook endpoint is accessible from MenuVerse
- Check that the order ID matches between systems
- Review server logs for errors

## 📚 Documentation

For more details, see:
- [API Endpoints](./API-ENDPOINTS.md)
- [Environment Variables](./ENVIRONMENT-VARIABLES.md)
- [Developer Integration Guide](./DEVELOPER-INTEGRATION-GUIDE.md)
