# Week 1, Days 2-3: Core GraphQL API Review & Enhancement Plan

## Date: February 7, 2026
## Status: In Progress
## Task: Complete Order Fulfillment Workflow - API Layer

---

## Current Implementation Status

### ✅ Already Implemented

#### 1. Order Placement (`placeOrder` mutation)
**Location**: `api/schema.js` lines 1457-1593

**Features**:
- ✅ Creates orders with full order details
- ✅ Calculates total amount (orderAmount + deliveryCharges + tipping + taxationAmount)
- ✅ Supports multiple payment methods (CASH, CARD, WALLET, BANK)
- ✅ CASH orders immediately confirmed
- ✅ Other payment methods set to PENDING_PAYMENT
- ✅ Generates unique order IDs (`ORD-{timestamp}-{random}`)
- ✅ Stores order in SQLite via `dbHelpers.createOrder()`
- ✅ Sends FCM notifications to available riders
- ✅ Includes status history tracking
- ✅ User authentication required
- ✅ Auto-syncs user to Supabase if not exists

**Input Parameters**:
```graphql
placeOrder(
  restaurant: String!
  orderInput: [OrderItemInput!]!
  paymentMethod: String!
  couponCode: String
  tipping: Float
  taxationAmount: Float
  address: String
  orderDate: String!
  isPickedUp: Boolean
  deliveryCharges: Float
  instructions: String
): Order!
```

#### 2. Order Status Management (`updateOrderStatus` mutation)
**Location**: `api/schema.js` lines 1594-1800

**Features**:
- ✅ Updates order status with validation
- ✅ Valid statuses: PENDING_PAYMENT, CONFIRMED, PROCESSING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
- ✅ Prevents invalid status transitions (can't change delivered/cancelled orders)
- ✅ Authorization check (order owner OR restaurant owner)
- ✅ Status history tracking with timestamps and notes
- ✅ Sends FCM notifications to riders when order is PROCESSING/PREPARING/READY
- ✅ Schedules reminder notifications 7 minutes before pickup
- ✅ Updates SQLite database
- ✅ Returns updated order with parsed JSON fields

**Input Parameters**:
```graphql
updateOrderStatus(
  orderId: ID!
  status: String!
  note: String
): Order!
```

#### 3. Payment Status Management (`updatePaymentStatus` mutation)
**Location**: `api/schema.js` lines 1800-1900

**Features**:
- ✅ Handles payment gateway callbacks
- ✅ Updates order status to CONFIRMED on successful payment
- ✅ Syncs to Firestore for real-time updates
- ✅ Updates customer-orders mirror collection
- ✅ Authorization check (order owner only)

#### 4. Order Queries
**Location**: `api/schema.js` lines 600-750

**Implemented Queries**:
- ✅ `orders`: Get all orders (currently allows unauthenticated for admin development)
- ✅ `order(id: ID!)`: Get single order by ID
- ✅ `availableOrders`: Get unassigned orders for riders
- ✅ `riderOrder(id: ID!)`: Rider-specific order view (assigned rider only)

#### 5. Rider-Specific Mutations
**Location**: `api/schema.js` lines 2300+

**Implemented**:
- ✅ `assignRider(orderId: ID!)`: Assign rider to order
- ✅ `riderUpdateOrderStatus(orderId: ID!, status: String!, code: String)`: Rider updates status
- ✅ `riderReportNotReady(orderId: ID!, waitedMinutes: Int)`: Report vendor not ready
- ✅ `riderCancelOrder(orderId: ID!, reason: String)`: Rider cancels order

#### 6. Firestore Sync
**Status**: ✅ Implemented in `updatePaymentStatus`
- Updates Firestore `orders` collection
- Updates `customer-orders` mirror collection

#### 7. FCM Notifications
**Status**: ✅ Fully Implemented
- New order notifications to available riders
- Status update notifications (PROCESSING, PREPARING, READY, OUT_FOR_DELIVERY)
- Scheduled reminder notifications 7 minutes before pickup
- Deep linking support
- Chunked sending for large rider lists (500 tokens per batch)

---

## 🔍 Gaps Identified for Week 1, Days 2-3

### 1. State-Based Filtering ❌ NOT IMPLEMENTED
**Issue**: Orders are not filtered by state
**Required**:
- Add state field to order placement
- Filter available orders by rider's state
- Filter restaurant orders by restaurant's state

### 2. Vendor-Specific Queries ❌ MISSING
**Issue**: No dedicated query for vendors to see their orders
**Required**:
```graphql
restaurantOrders(restaurantId: ID!, status: OrderStatus): [Order!]!
```

### 3. Vendor-Specific Mutations ❌ MISSING
**Issue**: No dedicated mutations for vendors
**Required**:
```graphql
acceptOrder(orderId: ID!): Order!
rejectOrder(orderId: ID!, reason: String!): Order!
```

### 4. Firestore Real-Time Sync ⚠️ PARTIAL
**Issue**: Only syncs in `updatePaymentStatus`, not in `updateOrderStatus`
**Required**:
- Sync to Firestore on every status change
- Sync to vendor-orders collection
- Sync to rider-orders collection

### 5. Auto-Dispatch Logic ❌ NOT IMPLEMENTED
**Issue**: No automatic rider dispatch when order marked as READY
**Required**:
- Find available riders in same state
- Calculate nearest rider
- Send dispatch notification
- Create delivery request in Firestore

### 6. Delivery Fee Calculation ❌ NOT IMPLEMENTED
**Issue**: Delivery fee is passed as parameter, not calculated
**Required**:
```graphql
calculateDeliveryFee(
  restaurantId: ID!
  deliveryLatitude: Float!
  deliveryLongitude: Float!
): Float!
```

---

## 📋 Implementation Plan for Days 2-3

### Priority 1: Vendor Order Management (Day 2 Morning)
**Tasks**:
1. Add `restaurantOrders` query
2. Add `acceptOrder` mutation
3. Add `rejectOrder` mutation
4. Test vendor order flow

### Priority 2: Enhanced Firestore Sync (Day 2 Afternoon)
**Tasks**:
1. Add Firestore sync to `updateOrderStatus`
2. Create vendor-orders subcollection
3. Create rider-orders subcollection
4. Test real-time updates across apps

### Priority 3: Auto-Dispatch System (Day 3 Morning)
**Tasks**:
1. Implement `dispatchToRider` function
2. Find available riders by state
3. Calculate nearest rider
4. Send dispatch notification
5. Create delivery request in Firestore
6. Test auto-dispatch flow

### Priority 4: State-Based Filtering (Day 3 Afternoon)
**Tasks**:
1. Add state to order placement
2. Filter available orders by state
3. Filter restaurant orders by state
4. Test state-based filtering

### Priority 5: Delivery Fee Calculation (If Time Permits)
**Tasks**:
1. Add `calculateDeliveryFee` query
2. Implement distance calculation
3. Apply delivery rate rules
4. Test fee calculation

---

## 🧪 Testing Checklist

### Order Placement
- [ ] Place order with CASH payment → Status: CONFIRMED
- [ ] Place order with CARD payment → Status: PENDING_PAYMENT
- [ ] Verify order saved to SQLite
- [ ] Verify riders receive FCM notification
- [ ] Verify order includes all fields (items, address, fees)

### Order Status Updates
- [ ] Vendor accepts order → Status: CONFIRMED
- [ ] Vendor marks preparing → Status: PROCESSING
- [ ] Vendor marks ready → Status: READY
- [ ] Verify status history updated
- [ ] Verify Firestore synced
- [ ] Verify notifications sent

### Vendor Queries
- [ ] Vendor can see their orders
- [ ] Vendor can filter by status
- [ ] Vendor cannot see other restaurant's orders

### Rider Queries
- [ ] Rider can see available orders in their state
- [ ] Rider can see assigned orders
- [ ] Rider cannot see orders from other states

### Auto-Dispatch
- [ ] Order marked READY triggers dispatch
- [ ] Nearest available rider receives notification
- [ ] Delivery request created in Firestore
- [ ] If rider declines, next rider notified

### Real-Time Sync
- [ ] Status changes appear in ChopChop < 1 second
- [ ] Status changes appear in MenuVerse < 1 second
- [ ] Status changes appear in RiderMi < 1 second
- [ ] Status changes appear in Admin < 1 second

---

## 📊 Success Criteria

### Technical Metrics
- ✅ Order placement to vendor notification: < 2 seconds
- ✅ Vendor "Ready" to rider dispatch: < 3 seconds
- ✅ Order status sync across apps: < 1 second
- ✅ All mutations return proper error messages
- ✅ All queries have proper authentication

### Business Metrics
- ✅ Vendors can manage orders end-to-end
- ✅ Riders receive relevant orders only (state-based)
- ✅ Customers see real-time status updates
- ✅ Admin can monitor all orders

---

## 🚀 Next Steps After Days 2-3

### Week 1, Days 4-5: Dispatch System
- Implement rider acceptance/decline
- Add navigation integration
- Implement location tracking

### Week 1, Days 6-7: Delivery Completion
- Add delivery code verification
- Implement proof of delivery
- Update rider earnings

---

## 📝 Notes

### Database Schema Status
- ✅ Orders table exists with all required fields
- ✅ State columns added via migration (Task 1.7 complete)
- ✅ Business hours columns added
- ✅ Delivery rates table created

### Current Database Helpers Available
- ✅ `createOrder(orderData)`
- ✅ `getOrderById(id)`
- ✅ `getOrdersByUser(userId)`
- ✅ `updateOrder(id, updates)`
- ✅ `getAvailableOrders()`
- ✅ `getRestaurantById(id)`
- ✅ `getUserByUid(uid)`

### Firebase/Firestore Setup
- ✅ Firebase Admin SDK initialized
- ✅ Firestore database connected
- ✅ FCM messaging configured
- ✅ Collections: orders, riders, customer-orders

---

**Last Updated**: February 7, 2026  
**Next Review**: End of Day 3  
**Status**: Ready to implement enhancements

