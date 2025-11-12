# **GraphQL API Quick Reference**

## **🚀 Server**
```bash
# Start server
npm start

# Development mode
npm run dev

# URL
http://localhost:4000/graphql
```

## **� Authentication**

### **Sign Up**
```graphql
mutation SignUp(
  $email: String!
  $password: String!
  $displayName: String
  $phoneNumber: String
) {
  signUp(
    email: $email
    password: $password
    displayName: $displayName
    phoneNumber: $phoneNumber
  ) {
    user { id email displayName phoneNumber }
    token
  }
}
```

### **Sign In**
```graphql
mutation SignIn($email: String!, $password: String!) {
  signIn(email: $email, password: $password) {
    user { id email displayName }
    token
  }
}
```

### **Sign In with Google**
```graphql
mutation SignInWithGoogle($idToken: String!) {
  signInWithGoogle(idToken: $idToken) {
    user { id email displayName }
    token
  }
}
```

### **Get Current User Profile**
```graphql
query { me { id email displayName phoneNumber addresses { id label street city isDefault } } }
```

### **Update Profile**
```graphql
mutation UpdateProfile($displayName: String, $phoneNumber: String, $photoURL: String) {
  updateProfile(displayName: $displayName, phoneNumber: $phoneNumber, photoURL: $photoURL) {
    id displayName phoneNumber
  }
}
```

### **Address Management**
```graphql
# Add Address
mutation AddAddress(
  $label: String!
  $street: String!
  $city: String!
  $state: String!
  $zipCode: String!
  $country: String!
  $isDefault: Boolean
) {
  addAddress(
    label: $label
    street: $street
    city: $city
    state: $state
    zipCode: $zipCode
    country: $country
    isDefault: $isDefault
  ) {
    id label street city isDefault
  }
}

# Get Addresses
query { addresses { id label street city state zipCode country isDefault } }

# Update Address
mutation UpdateAddress(
  $id: ID!
  $label: String
  $street: String
  $city: String
  $state: String
  $zipCode: String
  $country: String
  $isDefault: Boolean
) {
  updateAddress(
    id: $id
    label: $label
    street: $street
    city: $city
    state: $state
    zipCode: $zipCode
    country: $country
    isDefault: $isDefault
  ) {
    id label street city isDefault
  }
}

# Delete Address
mutation DeleteAddress($id: ID!) {
  deleteAddress(id: $id)
}
```

## **🏪 Restaurant Management**

### **Create Restaurant**
```graphql
mutation CreateRestaurant(
  $name: String!
  $description: String!
  $contactEmail: String
  $phoneNumber: String
  $address: String
  $cuisine: [String!]
  $priceRange: String
  $openingHours: [OpeningHourInput!]
) {
  createRestaurant(
    name: $name
    description: $description
    contactEmail: $contactEmail
    phoneNumber: $phoneNumber
    address: $address
    cuisine: $cuisine
    priceRange: $priceRange
    openingHours: $openingHours
  ) {
    id
    name
    description
    cuisine
    isActive
    openingHours {
      day
      open
      close
      isClosed
    }
  }
}
```

### **Get Restaurants**
```graphql
query Restaurants($search: String, $cuisine: String, $limit: Int) {
  restaurants(search: $search, cuisine: $cuisine, limit: $limit) {
    id
    name
    description
    cuisine
    isActive
    rating
    reviewCount
  }
}
```

### **Get Single Restaurant**
```graphql
query Restaurant($id: ID!) {
  restaurant(id: $id) {
    id
    name
    description
    contactEmail
    phoneNumber
    address
    cuisine
    priceRange
    isActive
    openingHours {
      day
      open
      close
      isClosed
    }
  }
}
```

### **Update Restaurant**
```graphql
mutation UpdateRestaurant(
  $id: ID!
  $description: String
  $phoneNumber: String
  $isActive: Boolean
) {
  updateRestaurant(
    id: $id
    description: $description
    phoneNumber: $phoneNumber
    isActive: $isActive
  ) {
    id
    name
    description
    phoneNumber
    isActive
  }
}
```

### **Create Menu Item**
```graphql
mutation CreateMenuItem(
  $restaurantId: ID!
  $name: String!
  $description: String
  $price: Float!
  $category: String
  $imageUrl: String
  $isAvailable: Boolean
  $isVegetarian: Boolean
  $isVegan: Boolean
  $allergens: [String!]
) {
  createMenuItem(
    restaurantId: $restaurantId
    name: $name
    description: $description
    price: $price
    category: $category
    imageUrl: $imageUrl
    isAvailable: $isAvailable
    isVegetarian: $isVegetarian
    isVegan: $isVegan
    allergens: $allergens
  ) {
    id
    name
    price
    isAvailable
    category
  }
}
```

### **Get Menu Items**
```graphql
query MenuItems($restaurantId: ID!) {
  menuItems(restaurantId: $restaurantId) {
    id
    name
    description
    price
    category
    isAvailable
    isVegetarian
    isVegan
    allergens
  }
}
```

### **Update Menu Item**
```graphql
mutation UpdateMenuItem(
  $id: ID!
  $price: Float
  $isAvailable: Boolean
  $description: String
) {
  updateMenuItem(
    id: $id
    price: $price
    isAvailable: $isAvailable
    description: $description
  ) {
    id
    name
    price
    isAvailable
    description
  }
}
```

### **Create Menu Category**
```graphql
mutation CreateMenuCategory(
  $restaurantId: ID!
  $name: String!
  $description: String
  $displayOrder: Int
) {
  createMenuCategory(
    restaurantId: $restaurantId
    name: $name
    description: $description
    displayOrder: $displayOrder
  ) {
    id
    name
    description
    displayOrder
  }
}
```

### **Get Menu Categories**
```graphql
query MenuCategories($restaurantId: ID!) {
  menuCategories(restaurantId: $restaurantId) {
    id
    name
    description
    displayOrder
  }
}
```

### **Delete Menu Item**
```graphql
mutation DeleteMenuItem($id: ID!) {
  deleteMenuItem(id: $id)
}
```

## ** Queries**

**Note:** User-specific queries (`me`, `orders`, `addresses`) require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### **Get User Profile**
```graphql
query { me { id email displayName phoneNumber addresses { id label street city isDefault } } }
```

### **Get User Orders**
```graphql
query { orders { id orderId orderStatus paidAmount paymentMethod restaurant } }
```

### **Get Single Order (User's Own)**
```graphql
query ($id: ID!) { order(id: $id) { id orderId orderStatus orderAmount statusHistory { status timestamp note } } }
```

### **Get User Addresses**
```graphql
query { addresses { id label street city state zipCode country isDefault } }
```

## **✏️ Mutations**

**Note:** Most mutations require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### **Place Order (Authenticated)**
```graphql
mutation PlaceOrder(
  $restaurant: String!
  $orderInput: [OrderItemInput!]!
  $paymentMethod: String!
  $orderDate: String!
) {
  placeOrder(
    restaurant: $restaurant
    orderInput: $orderInput
    paymentMethod: $paymentMethod
    orderDate: $orderDate
  ) {
    id orderId orderStatus
  }
}
```

### **Update Order Status**
```graphql
mutation UpdateOrderStatus($orderId: ID!, $status: String!, $note: String) {
  updateOrderStatus(orderId: $orderId, status: $status, note: $note) {
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

### **Place Order (Full)**
```graphql
mutation PlaceOrder(
  $restaurant: String!
  $orderInput: [OrderItemInput!]!
  $paymentMethod: String!
  $orderDate: String!
  $couponCode: String
  $tipping: Float
  $taxationAmount: Float
  $address: String
  $isPickedUp: Boolean
  $deliveryCharges: Float
  $instructions: String
) {
  placeOrder(
    restaurant: $restaurant
    orderInput: $orderInput
    paymentMethod: $paymentMethod
    orderDate: $orderDate
    couponCode: $couponCode
    tipping: $tipping
    taxationAmount: $taxationAmount
    address: $address
    isPickedUp: $isPickedUp
    deliveryCharges: $deliveryCharges
    instructions: $instructions
  ) {
    id orderId orderStatus paidAmount paymentMethod
  }
}
```

## **📊 Sample Data**

### **OrderItemInput**
```json
{
  "title": "Margherita Pizza",
  "food": "Pizza",
  "description": "Tomato sauce, mozzarella, basil",
  "quantity": 2,
  "variation": "Large",
  "addons": ["Extra Cheese"],
  "specialInstructions": "Well done",
  "price": 18.99,
  "total": 37.98
}
```

### **Complete Order Variables**
```json
{
  "restaurant": "Pizza Palace",
  "orderInput": [
    {
      "title": "Margherita Pizza",
      "food": "Pizza",
      "description": "Tomato sauce, mozzarella, basil",
      "quantity": 2,
      "price": 18.99,
      "total": 37.98
    }
  ],
  "paymentMethod": "CASH",
  "orderDate": "2025-11-03T20:00:00.000Z",
  "address": "123 Main St",
  "deliveryCharges": 3.99,
  "tipping": 5.00,
  "taxationAmount": 4.25
}
```

## **💰 Payment Methods**

| Method | Initial Status | Description |
|---|---|---|
| `CASH` | `CONFIRMED` | ✅ Immediate confirmation |
| `CARD` | `PENDING_PAYMENT` | ⏳ Needs payment processing |
| `WALLET` | `PENDING_PAYMENT` | ⏳ Needs wallet verification |
| `BANK` | `PENDING_PAYMENT` | ⏳ Needs bank transfer |

## **📊 Order Status Flow**

| Status | Description | Customer View |
|---|---|---|
| `PENDING_PAYMENT` | Payment processing | "Payment being processed" |
| `CONFIRMED` | Order confirmed | "Order confirmed" |
| `PROCESSING` | Being prepared | "Restaurant is preparing your order" |
| `READY` | Ready for pickup/delivery | "Order ready for pickup/delivery" |
| `OUT_FOR_DELIVERY` | Out for delivery | "Order is out for delivery" |
| `DELIVERED` | Successfully delivered | "Order delivered successfully" |
| `CANCELLED` | Order cancelled | "Order has been cancelled" |

## **🧪 Testing**

```bash
# Test Firebase
node test-firebase.js

# Test queries
node test-simple.js

# Test mutations
node test-running-server.js

# Integrated test
node test-integrated.js
```

## **🔧 Common Issues**

### **Server Won't Start**
```bash
# Check port usage
npx kill-port 4000

# Check .env file
node -e "require('dotenv').config(); console.log('OK')"
```

### **Firebase Errors**
```bash
# Test connection
node test-firebase.js

# Check credentials
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
```

### **GraphQL Errors**
- Check required fields (`!`)
- Verify data types
- Ensure server is running

## **📋 Field Requirements**

### **Required Fields**
- `OrderItemInput`: title, food, description, quantity, price, total
- `placeOrder`: restaurant, orderInput, paymentMethod, orderDate

### **Optional Fields**
- couponCode, tipping, taxationAmount, address, isPickedUp, deliveryCharges, instructions
- variation, addons, specialInstructions (in OrderItemInput)

## **📊 Response Format**

### **Success Response**
```json
{
  "data": {
    "placeOrder": {
      "id": "abc123",
      "orderId": "ORD-1762198297660-xyz789",
      "orderStatus": "CONFIRMED",
      "paidAmount": 46.22,
      "paymentMethod": "CASH"
    }
  }
}
```

### **Error Response**
```json
{
  "errors": [
    {
      "message": "Validation error",
      "locations": [{"line": 5, "column": 10}],
      "path": ["placeOrder"]
    }
  ],
  "data": null
}
```

## **🔗 Useful Links**

- **GraphQL Playground**: http://localhost:4000/graphql
- **Firebase Console**: https://console.firebase.google.com/project/chopchop-67750
- **Health Check**: http://localhost:4000/.well-known/apollo/server-health

---

**📝 Note**: Keep this reference handy during development!