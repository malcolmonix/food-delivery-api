# Order Tracking API Documentation

## Overview

The Order Tracking API provides a secure, performant way for customers to track their food delivery orders in real-time. This document describes the `orderTracking` GraphQL query, its behavior, error handling, and usage examples.

## GraphQL Query

### orderTracking

Retrieves comprehensive tracking information for a specific order.

**Type**: Query  
**Authentication**: Required (Firebase Auth token)  
**Authorization**: User can only access their own orders

#### Signature

```graphql
orderTracking(orderId: String!): OrderTracking
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | String | Yes | The public order ID (format: `ORD-{timestamp}-{random}`) or internal UUID |

#### Return Type: OrderTracking

```graphql
type OrderTracking {
  id: ID!                              # Internal order UUID
  orderId: String!                     # Public order ID (ORD-xxx format)
  restaurantId: String!                # Restaurant UUID
  restaurantName: String!              # Restaurant display name
  orderStatus: String!                 # Current order status
  deliveryStatus: String               # Delivery status (may match orderStatus)
  paymentMethod: String!               # Payment method used
  orderAmount: Float!                  # Subtotal before fees
  deliveryCharges: Float!              # Delivery fee
  tipping: Float!                      # Tip amount
  taxationAmount: Float!               # Tax amount
  paidAmount: Float!                   # Total amount paid
  deliveryAddress: String!             # Delivery address
  deliveryLatitude: Float              # Delivery location latitude
  deliveryLongitude: Float             # Delivery location longitude
  instructions: String                 # Special delivery instructions
  orderDate: String!                   # Order placement timestamp
  createdAt: String!                   # Order creation timestamp
  estimatedDeliveryTime: String        # Estimated delivery time
  customer: CustomerInfo!              # Customer information
  items: [OrderItemInfo!]!             # Order items
  rider: RiderInfo                     # Assigned rider (null if not assigned)
  statusHistory: [StatusHistoryItem!]! # Order status history
}
```

#### Nested Types

**CustomerInfo**
```graphql
type CustomerInfo {
  name: String!      # Customer name
  email: String!     # Customer email
  phone: String      # Customer phone number
  address: String!   # Customer address
}
```

**OrderItemInfo**
```graphql
type OrderItemInfo {
  id: String!        # Item ID
  name: String!      # Item name
  quantity: Int!     # Quantity ordered
  price: Float!      # Item price
  variation: String  # Item variation (size, etc.)
  addons: String     # Additional items/toppings
}
```

**RiderInfo**
```graphql
type RiderInfo {
  name: String!                # Rider name
  phone: String!               # Rider phone number
  vehicleNumber: String!       # Vehicle registration number
  currentLocation: LocationInfo # Current rider location
}
```

**StatusHistoryItem**
```graphql
type StatusHistoryItem {
  status: String!       # Status name
  timestamp: String!    # When status was set
  message: String       # Optional status message
  location: LocationInfo # Optional location data
}
```

**LocationInfo**
```graphql
type LocationInfo {
  latitude: Float!   # Latitude coordinate
  longitude: Float!  # Longitude coordinate
}
```

## Authentication Requirements

### Required Headers

```http
Authorization: Bearer <firebase-id-token>
```

The Firebase ID token must be:
- Valid and not expired
- Issued by the correct Firebase project
- Contain a valid `uid` claim

### Token Validation

The API validates the token and extracts the user ID (`uid`) to:
1. Verify the user is authenticated
2. Check order ownership
3. Log access attempts for security monitoring

## Authorization Rules

### Ownership Verification

Users can only access orders where `order.userId` matches their authenticated `uid`.

**Access Denied Scenarios**:
- User tries to access another user's order → `FORBIDDEN` error
- No authentication token provided → `UNAUTHENTICATED` error

**Security Note**: Error messages do not reveal whether an order exists when access is denied.

## Error Codes and Responses

### ORDER_NOT_FOUND

**Trigger**: Order ID doesn't exist in database  
**HTTP Status**: 400 Bad Request  
**GraphQL Error Code**: `ORDER_NOT_FOUND`

**Response**:
```json
{
  "errors": [{
    "message": "Order not found",
    "extensions": {
      "code": "ORDER_NOT_FOUND",
      "orderId": "ORD-1707577845000-abc123"
    }
  }]
}
```

**Frontend Action**: Display "We couldn't find this order. Please check your order ID and try again." with retry button.

### FORBIDDEN

**Trigger**: User tries to access another user's order  
**HTTP Status**: 403 Forbidden  
**GraphQL Error Code**: `FORBIDDEN`

**Response**:
```json
{
  "errors": [{
    "message": "You do not have permission to view this order",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }]
}
```

**Frontend Action**: Display "You don't have permission to view this order." without retry button.

### UNAUTHENTICATED

**Trigger**: No authentication token provided  
**HTTP Status**: 401 Unauthorized  
**GraphQL Error Code**: `UNAUTHENTICATED`

**Response**:
```json
{
  "errors": [{
    "message": "You must be logged in to view orders",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }]
}
```

**Frontend Action**: Redirect to login page.

### INTERNAL_ERROR

**Trigger**: Unexpected server error  
**HTTP Status**: 500 Internal Server Error  
**GraphQL Error Code**: `INTERNAL_ERROR`

**Response**:
```json
{
  "errors": [{
    "message": "Internal server error",
    "extensions": {
      "code": "INTERNAL_ERROR",
      "correlationId": "1707577845123-abc123def"
    }
  }]
}
```

**Frontend Action**: Display "Something went wrong. Please try again in a moment." with retry button.

## Usage Examples

### Example 1: Successful Order Tracking

**Request**:
```graphql
query GetOrderTracking($orderId: String!) {
  orderTracking(orderId: $orderId) {
    id
    orderId
    restaurantName
    orderStatus
    paidAmount
    estimatedDeliveryTime
    customer {
      name
      email
    }
    items {
      name
      quantity
      price
    }
    rider {
      name
      phone
      currentLocation {
        latitude
        longitude
      }
    }
    statusHistory {
      status
      timestamp
      message
    }
  }
}
```

**Variables**:
```json
{
  "orderId": "ORD-1707577845000-abc123"
}
```

**Response**:
```json
{
  "data": {
    "orderTracking": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "orderId": "ORD-1707577845000-abc123",
      "restaurantName": "Pizza Palace",
      "orderStatus": "PREPARING",
      "paidAmount": 25.99,
      "estimatedDeliveryTime": "2026-02-10T16:30:00Z",
      "customer": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "items": [
        {
          "name": "Margherita Pizza",
          "quantity": 1,
          "price": 12.99
        },
        {
          "name": "Caesar Salad",
          "quantity": 1,
          "price": 8.99
        }
      ],
      "rider": null,
      "statusHistory": [
        {
          "status": "PENDING",
          "timestamp": "2026-02-10T15:00:00Z",
          "message": "Order placed"
        },
        {
          "status": "ACCEPTED",
          "timestamp": "2026-02-10T15:02:00Z",
          "message": "Restaurant accepted order"
        },
        {
          "status": "PREPARING",
          "timestamp": "2026-02-10T15:05:00Z",
          "message": "Preparing your order"
        }
      ]
    }
  }
}
```

### Example 2: Order Not Found

**Request**:
```graphql
query GetOrderTracking($orderId: String!) {
  orderTracking(orderId: $orderId) {
    id
    orderId
  }
}
```

**Variables**:
```json
{
  "orderId": "ORD-INVALID-123"
}
```

**Response**:
```json
{
  "errors": [{
    "message": "Order not found",
    "extensions": {
      "code": "ORDER_NOT_FOUND",
      "orderId": "ORD-INVALID-123"
    }
  }],
  "data": {
    "orderTracking": null
  }
}
```

### Example 3: Unauthorized Access

**Request**: Same as Example 1, but user tries to access another user's order

**Response**:
```json
{
  "errors": [{
    "message": "You do not have permission to view this order",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }],
  "data": {
    "orderTracking": null
  }
}
```

### Example 4: Unauthenticated Request

**Request**: Same as Example 1, but without Authorization header

**Response**:
```json
{
  "errors": [{
    "message": "You must be logged in to view orders",
    "extensions": {
      "code": "UNAUTHENTICATED"
    }
  }],
  "data": {
    "orderTracking": null
  }
}
```

## Implementation Details

### Multi-Strategy Lookup

The API uses a two-strategy approach to find orders:

1. **Primary Strategy**: Query by `order_id` column (public ID format)
   - Uses indexed column for optimal performance
   - Handles standard order tracking URLs

2. **Fallback Strategy**: Query by `id` column (internal UUID)
   - Uses primary key index
   - Supports legacy URLs or direct UUID references

Both strategies are logged for debugging and performance monitoring.

### Performance Characteristics

- **Target Response Time**: < 200ms average, < 500ms for 95th percentile
- **Database Indexes**: `order_id`, `user_id`, `order_status`
- **Query Optimization**: Selects only necessary columns, uses `.single()` for efficiency
- **Execution Time Logging**: All queries log execution time for monitoring

### Logging and Monitoring

Every request generates a unique correlation ID for tracing:

**Log Format**:
```
[Resolver:{correlationId}] {event} - {details}
```

**Logged Events**:
- Query initiation with user ID and order ID
- Authentication verification
- Database lookup attempts (primary and fallback)
- Ownership verification
- Success or failure with execution time
- All errors with stack traces

**Example Log Entry**:
```
[Resolver:1707577845123-abc123def] orderTracking query initiated - orderId: ORD-1707577845000-xyz789, user: 0GI3MojVnLfvzSEqMc25oCzAmCz2
[Resolver:1707577845123-abc123def] Authentication verified - user: 0GI3MojVnLfvzSEqMc25oCzAmCz2
[Resolver:1707577845123-abc123def] Calling database helper for order lookup
[DB:1707577845124-def456ghi] Starting order lookup for orderId: ORD-1707577845000-xyz789
[DB:1707577845124-def456ghi] Strategy 1: Querying by order_id column (indexed)
[DB:1707577845124-def456ghi] ✅ Primary lookup succeeded in 45ms
[Resolver:1707577845123-abc123def] Order found - internal id: 550e8400-e29b-41d4-a716-446655440000, status: PREPARING
[Resolver:1707577845123-abc123def] Ownership verified - proceeding with data transformation
[Resolver:1707577845123-abc123def] SUCCESS - Returning tracking data for order ORD-1707577845000-xyz789
```

## Security Considerations

### Input Validation

- Order IDs are validated for format and length
- SQL injection prevention through parameterized queries
- XSS prevention through proper output encoding

### Rate Limiting

Recommended rate limits:
- 100 requests per minute per user
- 1000 requests per minute per IP address

### Audit Logging

All access attempts are logged with:
- User ID
- Order ID
- Timestamp
- Success/failure status
- IP address (if available)

### Information Disclosure Prevention

Error messages are carefully crafted to not reveal:
- Whether an order exists when access is denied
- User IDs or internal system details
- Database structure or query details

## Backward Compatibility

The API supports:
- Legacy order ID formats
- Orders created before the fix deployment
- Both public order IDs and internal UUIDs

## Related Documentation

- [GraphQL Schema](./schema.js)
- [Database Helper](./database.supabase.js)
- [Error Tracking](./ERROR_TRACKING_API_DOCUMENTATION.md)
- [API Quick Reference](./API-QUICK-REFERENCE.md)

## Support

For issues or questions:
- Check logs using the correlation ID
- Review error codes and responses above
- Contact the development team with correlation ID for investigation

---

**Last Updated**: February 10, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
