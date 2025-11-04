# MenuVerse ↔ ChopChop Order Sync

## Overview

This feature enables real-time order status synchronization between MenuVerse (vendor/restaurant management app) and ChopChop (customer food ordering app). When vendors update orders in MenuVerse, customers can see the updates in ChopChop.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  MenuVerse  │────────▶│  Food API    │◀────────│   ChopChop   │
│  (Vendor)   │         │  (Sync Hub)  │         │  (Customer)  │
└─────────────┘         └──────────────┘         └──────────────┘
      │                        │                         │
      │                        │                         │
      ▼                        ▼                         ▼
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  Firebase   │         │              │         │   Firebase   │
│  (MenuVerse)│◀────────│  Dual Sync   │────────▶│  (ChopChop)  │
└─────────────┘         └──────────────┘         └──────────────┘
```

## Features

### 1. **Dual Database Write**
When a ChopChop customer places an order from a MenuVerse restaurant:
- Order is saved to ChopChop Firebase (primary)
- Order is also saved to MenuVerse Firebase (secondary)
- MenuVerse vendor can immediately see the order

### 2. **Status Synchronization**
Three methods to keep order status in sync:

#### A. **Manual Sync** (User Initiated)
Customer pulls latest status from MenuVerse:
```graphql
mutation {
  syncOrderFromMenuVerse(orderId: "ORD-123", vendorId: "vendor-uid") {
    orderStatus
    lastSyncedAt
  }
}
```

#### B. **Bulk Sync** (Background Process)
Sync all user's orders at once:
```graphql
mutation {
  syncAllOrdersFromMenuVerse(limit: 20) {
    id
    orderStatus
    lastSyncedAt
  }
}
```

#### C. **Webhook** (Real-time)
MenuVerse pushes updates instantly:
```graphql
mutation {
  webhookMenuVerseOrderUpdate(
    orderId: "ORD-123"
    status: "CONFIRMED"
    riderInfo: { name: "John", phone: "+234-XXX" }
  ) {
    orderStatus
  }
}
```

### 3. **Rider Information Sync**
When vendors assign riders in MenuVerse, the information syncs to ChopChop:
- Rider name
- Phone number
- Vehicle type
- License plate

### 4. **Status History**
Complete audit trail of all status changes with timestamps and notes.

## Setup

### 1. Configure Environment Variables

Add to your `.env` file:

```env
# MenuVerse Firebase (Secondary Database)
SECONDARY_FIREBASE_PROJECT_ID=menuverse-project-id
SECONDARY_FIREBASE_PRIVATE_KEY_ID=xxxxx
SECONDARY_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SECONDARY_FIREBASE_CLIENT_EMAIL=firebase-adminsdk@menuverse-project.iam.gserviceaccount.com
SECONDARY_FIREBASE_CLIENT_ID=xxxxx
SECONDARY_FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/...
```

### 2. Get Firebase Credentials

**For MenuVerse Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your MenuVerse project
3. Go to **Settings** > **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file
6. Extract the values and add them to `.env` with `SECONDARY_` prefix

### 3. Test the Setup

```bash
# Start the API
npm start

# Run the sync test
node test-menuverse-sync.js

# Or with custom values
TEST_ORDER_ID="ORD-123" TEST_VENDOR_ID="vendor-uid" AUTH_TOKEN="your-token" node test-menuverse-sync.js
```

## Usage Examples

### For ChopChop App (Customer Side)

#### Place Order with MenuVerse Restaurant
```graphql
mutation PlaceOrder {
  placeOrder(
    restaurant: "Restaurant Name"
    orderInput: [
      { title: "Pizza", food: "item-123", quantity: 2, price: 15.99, total: 31.98 }
    ]
    paymentMethod: "CARD"
    orderDate: "2025-11-04T10:30:00Z"
    menuVerseVendorId: "0GI3MojVnLfvzSEqMc25oCzAmCz2"  # ← Important!
  ) {
    id
    orderId
    orderStatus
  }
}
```

#### Sync Order Status
```graphql
mutation SyncOrder {
  syncOrderFromMenuVerse(
    orderId: "ORD-1730726400000-abc123"
    vendorId: "0GI3MojVnLfvzSEqMc25oCzAmCz2"
  ) {
    orderStatus
    riderInfo {
      name
      phone
      vehicle
    }
    lastSyncedAt
  }
}
```

#### Sync All Orders
```graphql
mutation SyncAll {
  syncAllOrdersFromMenuVerse(limit: 20) {
    orderId
    orderStatus
    restaurant
    lastSyncedAt
  }
}
```

### For MenuVerse App (Vendor Side)

#### Update Order Status (Webhook)
When vendor updates order in MenuVerse, call this webhook:

```bash
curl -X POST https://your-api.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "mutation { webhookMenuVerseOrderUpdate(orderId: \"ORD-123\", status: \"CONFIRMED\", riderInfo: { name: \"John Doe\", phone: \"+234-XXX\" }) { orderStatus } }"
  }'
```

## Status Mapping

MenuVerse statuses are automatically mapped to ChopChop statuses:

| MenuVerse Status   | ChopChop Status    | Description                        |
|-------------------|--------------------|-------------------------------------|
| PENDING           | PENDING_PAYMENT    | Order received, awaiting payment   |
| PENDING_PAYMENT   | PENDING_PAYMENT    | Payment processing                 |
| CONFIRMED         | CONFIRMED          | Order confirmed by restaurant      |
| PROCESSING        | PROCESSING         | Food being prepared                |
| READY             | READY              | Order ready for pickup/delivery    |
| OUT_FOR_DELIVERY  | OUT_FOR_DELIVERY   | Rider on the way                   |
| DELIVERED         | DELIVERED          | Order successfully delivered       |
| CANCELLED         | CANCELLED          | Order cancelled                    |

## Best Practices

### 1. **Always Include Vendor ID**
When placing orders, include `menuVerseVendorId`:
```graphql
menuVerseVendorId: "0GI3MojVnLfvzSEqMc25oCzAmCz2"
```

### 2. **Implement Auto-Sync**
In ChopChop app, set up automatic syncing:
```javascript
// Sync active orders every 30 seconds
setInterval(() => {
  if (hasActiveOrders) {
    syncAllOrdersFromMenuVerse({ limit: 10 });
  }
}, 30000);
```

### 3. **Use Webhooks for Real-time**
Configure MenuVerse to call webhook endpoint when status changes for instant updates.

### 4. **Handle Errors Gracefully**
```javascript
try {
  await syncOrderFromMenuVerse({ orderId });
} catch (error) {
  if (error.message.includes('not configured')) {
    // MenuVerse integration not available
    showOfflineMode();
  } else {
    // Other error
    showRetryOption();
  }
}
```

### 5. **Show Sync Status**
Display `lastSyncedAt` to users:
```javascript
const timeSinceSync = Date.now() - new Date(order.lastSyncedAt);
if (timeSinceSync > 60000) {
  showSyncButton(); // "Update Order Status"
}
```

## Troubleshooting

### "MenuVerse integration not configured"
- Check that all `SECONDARY_FIREBASE_*` environment variables are set
- Verify the private key is properly formatted with `\n` for newlines
- Restart the API server after adding variables

### "Order not found in MenuVerse"
- Verify the `menuVerseVendorId` was included when placing the order
- Check that the vendor UID is correct
- Ensure the order exists in MenuVerse Firebase

### "Access denied"
- User can only sync their own orders
- Verify the authentication token is valid
- Check that the order's `userId` matches the authenticated user

### Status Not Updating
- Check if order status in MenuVerse has actually changed
- Verify status mapping is correct
- Try manual sync: `syncOrderFromMenuVerse`
- Check API logs for sync attempts

## Security

### Authentication
- All sync mutations require user authentication
- Users can only sync their own orders
- Webhook should validate API key (implement middleware)

### Data Privacy
- Rider information only shared when order is OUT_FOR_DELIVERY
- Customer data not exposed to MenuVerse beyond order details
- Sensitive payment info never synced

## Performance

### Optimization Tips
1. **Limit bulk syncs**: Use `limit` parameter
   ```graphql
   syncAllOrdersFromMenuVerse(limit: 10)  # Only recent/active orders
   ```

2. **Cache results**: Store `lastSyncedAt` and skip if recently synced
   ```javascript
   if (Date.now() - lastSync < 30000) return; // Skip if synced < 30s ago
   ```

3. **Use webhooks**: Most efficient for real-time updates

4. **Sync on demand**: Only sync when user views order details

## Testing

### Run the test suite:
```bash
# Basic test
node test-menuverse-sync.js

# With specific order
TEST_ORDER_ID="ORD-123" node test-menuverse-sync.js

# With authentication
AUTH_TOKEN="your-token" node test-menuverse-sync.js
```

### Manual testing with curl:
```bash
# Sync single order
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "mutation { syncOrderFromMenuVerse(orderId: \"ORD-123\") { orderStatus } }"}'
```

## Future Enhancements

- [ ] WebSocket subscriptions for real-time sync
- [ ] Conflict resolution for simultaneous updates
- [ ] Batch webhook processing
- [ ] Sync analytics and monitoring
- [ ] Automatic retry on sync failures
- [ ] Push notifications on status change

## Support

For issues or questions:
1. Check the [API Documentation](./API-ENDPOINTS.md)
2. Review [Environment Variables Guide](./ENVIRONMENT-VARIABLES.md)
3. Run the test suite for diagnostics
4. Check API server logs for errors

---

**Version:** 1.0.0  
**Last Updated:** November 4, 2025  
**Status:** ✅ Production Ready
