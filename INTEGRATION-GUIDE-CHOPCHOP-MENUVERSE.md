# ChopChop & Menuverse Integration Guide

This guide provides complete instructions for integrating the Food Delivery API with ChopChop and Menuverse applications.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Core Features](#core-features)
- [Image Management](#image-management)
- [Data Models](#data-models)
- [API Operations](#api-operations)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## 🎯 Overview

The Food Delivery API is a GraphQL-based backend service that provides:

- **User Management**: Authentication, profiles, and addresses
- **Restaurant Management**: CRUD operations for restaurants and menus
- **Order Management**: Complete order lifecycle from placement to delivery
- **Image Storage**: Upload and manage restaurant and menu item images
- **Real-time Updates**: Order status tracking with history

### Technology Stack

- **API**: GraphQL with Apollo Server
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Server**: Node.js + Express

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 16 or higher
node --version

# npm package manager
npm --version
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd food-delivery-api

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Start the server
npm start
```

### GraphQL Endpoint

```
http://localhost:4000/graphql
```

### GraphQL Playground (Development)

```
http://localhost:4000/graphql
```

Open in browser to explore the API interactively.

## 🔐 Authentication

### Overview

The API uses Firebase Authentication with Bearer token authorization.

### Authentication Flow

1. **Sign Up / Sign In**
   - Create account or authenticate user
   - Receive authentication token

2. **Include Token in Requests**
   - Add `Authorization: Bearer <token>` header
   - Token is validated on each request

### Sign Up Example

```graphql
mutation SignUp {
  signUp(
    email: "user@example.com"
    password: "securePassword123"
    displayName: "John Doe"
    phoneNumber: "+1234567890"
  ) {
    user {
      id
      email
      displayName
      phoneNumber
    }
    token
  }
}
```

### Sign In Example

```graphql
mutation SignIn {
  signIn(
    email: "user@example.com"
    password: "securePassword123"
  ) {
    user {
      id
      email
      displayName
    }
    token
  }
}
```

### Google Sign In

```graphql
mutation SignInWithGoogle {
  signInWithGoogle(idToken: "firebase-id-token-from-client") {
    user {
      id
      email
      displayName
      photoURL
    }
    token
  }
}
```

### Using the Token

```javascript
// In your GraphQL client (e.g., Apollo Client)
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  headers: {
    authorization: `Bearer ${authToken}`,
  },
});
```

## 🍽️ Core Features

### 1. Restaurant Management

#### Create Restaurant

```graphql
mutation CreateRestaurant {
  createRestaurant(
    name: "The Gourmet Kitchen"
    description: "Fine dining experience with locally sourced ingredients"
    contactEmail: "contact@gourmetkitchen.com"
    phoneNumber: "+1234567890"
    address: "123 Main Street, City, State 12345"
    cuisine: ["Italian", "Mediterranean"]
    priceRange: "$$$"
    openingHours: [
      { day: "Monday", open: "11:00", close: "22:00", isClosed: false }
      { day: "Tuesday", open: "11:00", close: "22:00", isClosed: false }
      { day: "Sunday", open: "12:00", close: "20:00", isClosed: false }
    ]
  ) {
    id
    name
    description
    logoUrl
    cuisine
    priceRange
    isActive
  }
}
```

#### Query Restaurants

```graphql
query GetRestaurants {
  restaurants(
    search: "pizza"
    cuisine: "Italian"
    limit: 10
    offset: 0
  ) {
    id
    name
    description
    logoUrl
    bannerUrl
    cuisine
    priceRange
    rating
    reviewCount
    isActive
    address
    phoneNumber
  }
}
```

#### Get Single Restaurant

```graphql
query GetRestaurant($id: ID!) {
  restaurant(id: $id) {
    id
    name
    description
    logoUrl
    bannerUrl
    cuisine
    priceRange
    rating
    reviewCount
    address
    phoneNumber
    contactEmail
    openingHours {
      day
      open
      close
      isClosed
    }
  }
}
```

#### Update Restaurant

```graphql
mutation UpdateRestaurant {
  updateRestaurant(
    id: "restaurant-id"
    name: "Updated Restaurant Name"
    description: "Updated description"
    isActive: true
  ) {
    id
    name
    description
    updatedAt
  }
}
```

### 2. Menu Management

#### Create Menu Item

```graphql
mutation CreateMenuItem {
  createMenuItem(
    restaurantId: "restaurant-id"
    name: "Margherita Pizza"
    description: "Classic pizza with fresh tomatoes, mozzarella, and basil"
    price: 12.99
    category: "Pizza"
    imageUrl: "https://example.com/pizza.jpg"
    imageHint: "Delicious margherita pizza"
    isAvailable: true
    isVegetarian: true
    isVegan: false
    allergens: ["Dairy", "Gluten"]
  ) {
    id
    name
    description
    price
    category
    imageUrl
    isAvailable
    isVegetarian
    isVegan
    allergens
  }
}
```

#### Get Menu Items

```graphql
query GetMenuItems($restaurantId: ID!) {
  menuItems(restaurantId: $restaurantId) {
    id
    name
    description
    price
    category
    imageUrl
    imageHint
    isAvailable
    isVegetarian
    isVegan
    allergens
  }
}
```

#### Update Menu Item

```graphql
mutation UpdateMenuItem {
  updateMenuItem(
    id: "menu-item-id"
    price: 14.99
    isAvailable: true
  ) {
    id
    name
    price
    isAvailable
    updatedAt
  }
}
```

#### Delete Menu Item

```graphql
mutation DeleteMenuItem {
  deleteMenuItem(id: "menu-item-id")
}
```

### 3. Menu Categories

#### Create Category

```graphql
mutation CreateMenuCategory {
  createMenuCategory(
    restaurantId: "restaurant-id"
    name: "Appetizers"
    description: "Start your meal with these delicious appetizers"
    displayOrder: 1
  ) {
    id
    name
    description
    displayOrder
  }
}
```

#### Get Categories

```graphql
query GetMenuCategories($restaurantId: ID!) {
  menuCategories(restaurantId: $restaurantId) {
    id
    name
    description
    displayOrder
  }
}
```

### 4. Order Management

#### Place Order

```graphql
mutation PlaceOrder {
  placeOrder(
    restaurant: "The Gourmet Kitchen"
    orderInput: [
      {
        title: "Margherita Pizza"
        food: "Pizza"
        description: "Classic pizza with fresh ingredients"
        quantity: 2
        variation: "Large"
        addons: ["Extra Cheese", "Olives"]
        specialInstructions: "Well done, please"
        price: 12.99
        total: 25.98
      }
      {
        title: "Caesar Salad"
        food: "Salad"
        description: "Fresh romaine with Caesar dressing"
        quantity: 1
        price: 8.99
        total: 8.99
      }
    ]
    paymentMethod: "CARD"
    orderDate: "2025-11-12T00:00:00.000Z"
    address: "123 Main St, Apt 4B, City, State 12345"
    deliveryCharges: 3.99
    tipping: 5.00
    taxationAmount: 3.50
    instructions: "Please ring the doorbell"
  ) {
    id
    orderId
    orderStatus
    restaurant
    orderAmount
    paidAmount
    paymentMethod
    orderDate
    deliveryCharges
    tipping
    taxationAmount
    address
    instructions
    orderItems {
      title
      quantity
      price
      total
      variation
      addons
      specialInstructions
    }
    statusHistory {
      status
      timestamp
      note
    }
  }
}
```

#### Get User Orders

```graphql
query GetMyOrders {
  orders {
    id
    orderId
    orderStatus
    restaurant
    orderAmount
    paidAmount
    paymentMethod
    orderDate
    expectedTime
    statusHistory {
      status
      timestamp
      note
    }
  }
}
```

#### Get Single Order

```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    orderId
    orderStatus
    restaurant
    orderAmount
    paidAmount
    paymentMethod
    orderDate
    orderItems {
      title
      food
      description
      quantity
      variation
      addons
      specialInstructions
      price
      total
    }
    address
    instructions
    deliveryCharges
    tipping
    taxationAmount
    statusHistory {
      status
      timestamp
      note
    }
  }
}
```

#### Update Order Status

```graphql
mutation UpdateOrderStatus {
  updateOrderStatus(
    orderId: "order-document-id"
    status: "CONFIRMED"
    note: "Payment received and order confirmed"
  ) {
    id
    orderId
    orderStatus
    statusHistory {
      status
      timestamp
      note
    }
    updatedAt
  }
}
```

### 5. Address Management

#### Add Address

```graphql
mutation AddAddress {
  addAddress(
    label: "Home"
    street: "123 Main Street, Apt 4B"
    city: "San Francisco"
    state: "CA"
    zipCode: "94102"
    country: "USA"
    isDefault: true
  ) {
    id
    label
    street
    city
    state
    zipCode
    country
    isDefault
  }
}
```

#### Get User Addresses

```graphql
query GetAddresses {
  addresses {
    id
    label
    street
    city
    state
    zipCode
    country
    isDefault
  }
}
```

#### Update Address

```graphql
mutation UpdateAddress {
  updateAddress(
    id: "address-id"
    street: "456 New Street, Apt 10C"
    isDefault: true
  ) {
    id
    label
    street
    city
    state
    zipCode
    isDefault
    updatedAt
  }
}
```

#### Delete Address

```graphql
mutation DeleteAddress {
  deleteAddress(id: "address-id")
}
```

## 📸 Image Management

For comprehensive image handling instructions, including upload, retrieval, display, and best practices, see the [Unified Image Handling Guide](../docs/IMAGE-HANDLING-GUIDE.md).

## 📊 Data Models

### User

```typescript
type User {
  id: ID!              // Firebase UID
  uid: String!         // Firebase UID (duplicate)
  email: String!       // User email
  displayName: String  // User's display name
  phoneNumber: String  // Phone number
  photoURL: String     // Profile photo URL
  addresses: [Address!]! // User addresses
  createdAt: String!   // ISO 8601 timestamp
  updatedAt: String!   // ISO 8601 timestamp
}
```

### Restaurant

```typescript
type Restaurant {
  id: ID!                    // Firestore document ID
  name: String!              // Restaurant name
  description: String!       // Description
  logoUrl: String           // Logo image URL
  bannerUrl: String         // Banner image URL
  contactEmail: String      // Contact email
  phoneNumber: String       // Phone number
  address: String           // Physical address
  cuisine: [String!]!       // Cuisine types
  priceRange: String        // Price range ($, $$, $$$)
  rating: Float             // Average rating
  reviewCount: Int          // Number of reviews
  isActive: Boolean!        // Is restaurant active
  openingHours: [OpeningHour!]! // Operating hours
  createdAt: String!        // ISO 8601 timestamp
  updatedAt: String!        // ISO 8601 timestamp
}
```

### MenuItem

```typescript
type MenuItem {
  id: ID!              // Firestore document ID
  restaurantId: String! // Parent restaurant ID
  name: String!        // Item name
  description: String! // Description
  price: Float!        // Price
  category: String!    // Category
  imageUrl: String     // Image URL
  imageHint: String    // Image alt text
  isAvailable: Boolean! // Availability
  isVegetarian: Boolean // Vegetarian flag
  isVegan: Boolean     // Vegan flag
  allergens: [String!] // List of allergens
  createdAt: String!   // ISO 8601 timestamp
  updatedAt: String!   // ISO 8601 timestamp
}
```

### Order

```typescript
type Order {
  id: ID!                  // Firestore document ID
  orderId: String!         // Generated order ID (ORD-timestamp-random)
  userId: String!          // User ID who placed order
  restaurant: String!      // Restaurant name
  orderItems: [OrderItem!]! // Ordered items
  orderAmount: Float!      // Subtotal
  paidAmount: Float!       // Total amount paid
  paymentMethod: String!   // CASH | CARD | WALLET | BANK
  orderStatus: String!     // Order status
  orderDate: String!       // ISO 8601 timestamp
  expectedTime: String     // Expected delivery time
  isPickedUp: Boolean      // Pickup vs delivery
  deliveryCharges: Float   // Delivery fee
  tipping: Float           // Tip amount
  taxationAmount: Float    // Tax amount
  address: String          // Delivery address
  instructions: String     // Special instructions
  couponCode: String       // Applied coupon
  statusHistory: [StatusUpdate!]! // Status history
  createdAt: String!       // ISO 8601 timestamp
  updatedAt: String!       // ISO 8601 timestamp
}
```

### Order Status Flow

```
PENDING_PAYMENT (Card/Wallet/Bank only)
    ↓
CONFIRMED (Cash orders start here)
    ↓
PROCESSING (Restaurant preparing)
    ↓
READY (Ready for pickup/delivery)
    ↓
OUT_FOR_DELIVERY (Delivery in progress)
    ↓
DELIVERED (Completed)

CANCELLED (Can be set from any status)
```

## 🔧 API Operations

### Complete API Reference

#### Queries

| Query | Description | Authentication |
|-------|-------------|----------------|
| `me` | Get current user profile | Required |
| `orders` | Get all user orders | Required |
| `order(id)` | Get single order | Required |
| `addresses` | Get user addresses | Required |
| `address(id)` | Get single address | Required |
| `restaurants` | Search/list restaurants | Optional |
| `restaurant(id)` | Get single restaurant | Optional |
| `menuItems(restaurantId)` | Get restaurant menu items | Optional |
| `menuItem(id)` | Get single menu item | Optional |
| `menuCategories(restaurantId)` | Get restaurant menu categories | Optional |

#### Mutations

| Mutation | Description | Authentication |
|----------|-------------|----------------|
| `signUp` | Create new user account | No |
| `signIn` | Sign in with email/password | No |
| `signInWithGoogle` | Sign in with Google | No |
| `signInWithPhone` | Sign in with phone | No |
| `updateProfile` | Update user profile | Required |
| `addAddress` | Add user address | Required |
| `updateAddress` | Update user address | Required |
| `deleteAddress` | Delete user address | Required |
| `placeOrder` | Create new order | Required |
| `updateOrderStatus` | Update order status | Required |
| `createRestaurant` | Create restaurant | Required |
| `updateRestaurant` | Update restaurant | Required (owner) |
| `createMenuItem` | Create menu item | Required (owner) |
| `updateMenuItem` | Update menu item | Required (owner) |
| `deleteMenuItem` | Delete menu item | Required (owner) |
| `createMenuCategory` | Create menu category | Required (owner) |
| `updateMenuCategory` | Update menu category | Required (owner) |
| `deleteMenuCategory` | Delete menu category | Required (owner) |
| `uploadImage` | Upload generic image | Required |
| `uploadRestaurantLogo` | Upload restaurant logo | Required (owner) |
| `uploadRestaurantBanner` | Upload restaurant banner | Required (owner) |
| `uploadMenuItemImage` | Upload menu item image | Required (owner) |

## ❌ Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["orders"],
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ],
  "data": null
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `UNAUTHENTICATED` | No auth token provided | Include `Authorization` header |
| `FORBIDDEN` | Access denied | Check user permissions |
| `BAD_USER_INPUT` | Invalid input data | Validate input fields |
| `NOT_FOUND` | Resource not found | Check resource ID |
| `INTERNAL_SERVER_ERROR` | Server error | Check server logs |

### Client-Side Error Handling

```javascript
try {
  const { data } = await client.query({
    query: GET_ORDERS,
  });
  console.log('Orders:', data.orders);
} catch (error) {
  if (error.networkError) {
    console.error('Network error:', error.networkError);
  }
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(({ message, extensions }) => {
      console.error(`GraphQL error: ${message}`, extensions);
    });
  }
}
```

## ✅ Best Practices

### 1. Authentication

- Always include the auth token in requests
- Refresh tokens before they expire
- Handle authentication errors gracefully
- Store tokens securely (not in localStorage for sensitive apps)

### 2. Query Optimization

- Request only the fields you need
- Use pagination for large lists
- Implement proper error handling
- Cache responses when appropriate

### 3. Order Management

- Validate order data before submission
- Handle payment method logic correctly
- Implement status polling for real-time updates
- Display clear status messages to users

### 4. Image Uploads

- Validate file types before upload
- Show upload progress to users
- Handle upload failures gracefully
- Compress images before upload for better performance

### 5. Error Handling

- Display user-friendly error messages
- Log errors for debugging
- Implement retry logic for network errors
- Validate input data on the client side

## 📞 Support & Resources

### Documentation

- [API Endpoints](./API-ENDPOINTS.md)
- [Developer Integration Guide](./DEVELOPER-INTEGRATION-GUIDE.md)
- [Environment Variables](./ENVIRONMENT-VARIABLES.md)
- [API Quick Reference](./API-QUICK-REFERENCE.md)

### Testing

```bash
# Run all tests
npm test

# Test Firebase connection
node test-firebase.js

# Test GraphQL operations
node test-simple.js

# Test order placement
node test-place-order.js

# Test status updates
node test-status-updates.js
```

### Health Check

```bash
# Check server health
curl http://localhost:4000/.well-known/apollo/server-health
```

### GraphQL Playground

For interactive API exploration:
```
http://localhost:4000/graphql
```

## 🎉 Quick Integration Checklist

### For ChopChop

- [ ] Set up Apollo Client with upload support
- [ ] Implement user authentication flow
- [ ] Create order placement UI
- [ ] Implement order tracking
- [ ] Add restaurant browsing
- [ ] Implement menu item display
- [ ] Add image upload for user profiles
- [ ] Implement address management

### For Menuverse

- [ ] Set up Apollo Client
- [ ] Implement restaurant owner authentication
- [ ] Create restaurant management UI
- [ ] Implement menu item CRUD operations
- [ ] Add menu category management
- [ ] Implement image uploads (logo, banner, menu items)
- [ ] Add order status management
- [ ] Implement analytics dashboard

---

**Version:** 1.0.0  
**Last Updated:** November 12, 2025  
**API Status:** ✅ Production Ready
