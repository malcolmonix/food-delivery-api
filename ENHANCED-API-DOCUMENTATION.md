# Enhanced GraphQL API Documentation

## Overview

The Food Delivery GraphQL API provides a comprehensive backend for ChopChop (customer app) and MenuVerse (vendor dashboard). This documentation covers the complete API schema, operations, and integration patterns.

## Server Information

- **GraphQL Endpoint**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/.well-known/apollo/server-health`
- **Technology**: Apollo Server with Firebase Firestore + SQLite
- **Authentication**: Firebase Auth with Bearer tokens

## Schema Types

### Core Types

```graphql
type User {
  id: ID!
  uid: String!
  email: String!
  displayName: String
  phoneNumber: String
  photoURL: String
  addresses: [Address!]!
  createdAt: String!
  updatedAt: String!
}

type Address {
  id: ID!
  userId: String!
  label: String!
  street: String!
  city: String!
  state: String!
  zipCode: String!
  country: String!
  isDefault: Boolean!
  createdAt: String!
  updatedAt: String!
}

type Restaurant {
  id: ID!
  name: String!
  description: String!
  logoUrl: String
  bannerUrl: String
  contactEmail: String
  phoneNumber: String
  address: String
  cuisine: [String!]!
  priceRange: String
  rating: Float
  reviewCount: Int
  isActive: Boolean!
  openingHours: [OpeningHour!]!
  createdAt: String!
  updatedAt: String!
}

type OpeningHour {
  day: String!
  open: String!
  close: String!
  isClosed: Boolean!
}

type MenuItem {
  id: ID!
  restaurantId: String!
  name: String!
  description: String!
  price: Float!
  category: String!
  imageUrl: String
  imageHint: String
  isAvailable: Boolean!
  isVegetarian: Boolean!
  isVegan: Boolean!
  allergens: [String!]!
  createdAt: String!
  updatedAt: String!
}

type MenuCategory {
  id: ID!
  restaurantId: String!
  name: String!
  description: String
  displayOrder: Int!
  createdAt: String!
  updatedAt: String!
}

type Order {
  id: ID!
  orderId: String!
  userId: String!
  restaurant: String!
  orderItems: [OrderItem!]!
  orderAmount: Float!
  paidAmount: Float!
  paymentMethod: String!
  orderStatus: String!
  orderDate: String!
  expectedTime: String
  isPickedUp: Boolean
  deliveryCharges: Float
  tipping: Float
  taxationAmount: Float
  address: String
  instructions: String
  couponCode: String
  statusHistory: [StatusUpdate!]!
  createdAt: String!
  updatedAt: String!
}

type OrderItem {
  id: String!
  title: String!
  food: String!
  description: String!
  quantity: Int!
  variation: String
  addons: [String]
  specialInstructions: String
  price: Float!
  total: Float!
}

type StatusUpdate {
  status: String!
  timestamp: String!
  note: String
}

type AuthPayload {
  user: User!
  token: String!
}
```

### Input Types

```graphql
input OpeningHourInput {
  day: String!
  open: String!
  close: String!
  isClosed: Boolean!
}

input MenuItemInput {
  name: String!
  description: String!
  price: Float!
  category: String!
  imageUrl: String
  imageHint: String
  isAvailable: Boolean
  isVegetarian: Boolean
  isVegan: Boolean
  allergens: [String!]
}

input MenuCategoryInput {
  name: String!
  description: String
  displayOrder: Int
}

input OrderItemInput {
  title: String!
  food: String!
  description: String!
  quantity: Int!
  variation: String
  addons: [String]
  specialInstructions: String
  price: Float!
  total: Float!
}
```

## Queries

### User Queries

```graphql
# Get current authenticated user
query Me {
  me {
    id
    uid
    email
    displayName
    phoneNumber
    photoURL
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
    createdAt
    updatedAt
  }
}

# Get user's orders
query GetOrders {
  orders {
    id
    orderId
    userId
    restaurant
    orderItems {
      id
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
    orderAmount
    paidAmount
    paymentMethod
    orderStatus
    orderDate
    expectedTime
    isPickedUp
    deliveryCharges
    tipping
    taxationAmount
    address
    instructions
    couponCode
    statusHistory {
      status
      timestamp
      note
    }
    createdAt
    updatedAt
  }
}

# Get single order
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    orderId
    userId
    restaurant
    orderItems {
      id
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
    orderAmount
    paidAmount
    paymentMethod
    orderStatus
    orderDate
    expectedTime
    isPickedUp
    deliveryCharges
    tipping
    taxationAmount
    address
    instructions
    couponCode
    statusHistory {
      status
      timestamp
      note
    }
    createdAt
    updatedAt
  }
}

# Get user addresses
query GetAddresses {
  addresses {
    id
    userId
    label
    street
    city
    state
    zipCode
    country
    isDefault
    createdAt
    updatedAt
  }
}

# Get single address
query GetAddress($id: ID!) {
  address(id: $id) {
    id
    userId
    label
    street
    city
    state
    zipCode
    country
    isDefault
    createdAt
    updatedAt
  }
}
```

### Restaurant Queries

```graphql
# Search restaurants
query GetRestaurants(
  $search: String
  $cuisine: String
  $limit: Int
  $offset: Int
) {
  restaurants(
    search: $search
    cuisine: $cuisine
    limit: $limit
    offset: $offset
  ) {
    id
    name
    description
    logoUrl
    bannerUrl
    contactEmail
    phoneNumber
    address
    cuisine
    priceRange
    rating
    reviewCount
    isActive
    openingHours {
      day
      open
      close
      isClosed
    }
    createdAt
    updatedAt
  }
}

# Get single restaurant
query GetRestaurant($id: ID!) {
  restaurant(id: $id) {
    id
    name
    description
    logoUrl
    bannerUrl
    contactEmail
    phoneNumber
    address
    cuisine
    priceRange
    rating
    reviewCount
    isActive
    openingHours {
      day
      open
      close
      isClosed
    }
    createdAt
    updatedAt
  }
}

# Get restaurant menu items
query GetMenuItems($restaurantId: ID!) {
  menuItems(restaurantId: $restaurantId) {
    id
    restaurantId
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
    createdAt
    updatedAt
  }
}

# Get restaurant menu categories
query GetMenuCategories($restaurantId: ID!) {
  menuCategories(restaurantId: $restaurantId) {
    id
    restaurantId
    name
    description
    displayOrder
    createdAt
    updatedAt
  }
}

# Get single menu item
query GetMenuItem($id: ID!) {
  menuItem(id: $id) {
    id
    restaurantId
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
    createdAt
    updatedAt
  }
}
```

## Mutations

### Authentication Mutations

```graphql
# Sign up new user
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
    user {
      id
      uid
      email
      displayName
      phoneNumber
      photoURL
      addresses
      createdAt
      updatedAt
    }
    token
  }
}

# Sign in with email/password
mutation SignIn($email: String!, $password: String!) {
  signIn(email: $email, password: $password) {
    user {
      id
      uid
      email
      displayName
      phoneNumber
      photoURL
      addresses
      createdAt
      updatedAt
    }
    token
  }
}

# Sign in with Google
mutation SignInWithGoogle($idToken: String!) {
  signInWithGoogle(idToken: $idToken) {
    user {
      id
      uid
      email
      displayName
      phoneNumber
      photoURL
      addresses
      createdAt
      updatedAt
    }
    token
  }
}

# Sign in with phone
mutation SignInWithPhone(
  $phoneNumber: String!
  $verificationId: String!
  $code: String!
) {
  signInWithPhone(
    phoneNumber: $phoneNumber
    verificationId: $verificationId
    code: $code
  ) {
    user {
      id
      uid
      email
      displayName
      phoneNumber
      photoURL
      addresses
      createdAt
      updatedAt
    }
    token
  }
}

# Update user profile
mutation UpdateProfile(
  $displayName: String
  $phoneNumber: String
  $photoURL: String
) {
  updateProfile(
    displayName: $displayName
    phoneNumber: $phoneNumber
    photoURL: $photoURL
  ) {
    id
    uid
    email
    displayName
    phoneNumber
    photoURL
    addresses
    createdAt
    updatedAt
  }
}
```

### Address Mutations

```graphql
# Add new address
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
    id
    userId
    label
    street
    city
    state
    zipCode
    country
    isDefault
    createdAt
    updatedAt
  }
}

# Update address
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
    id
    userId
    label
    street
    city
    state
    zipCode
    country
    isDefault
    createdAt
    updatedAt
  }
}

# Delete address
mutation DeleteAddress($id: ID!) {
  deleteAddress(id: $id)
}
```

### Restaurant Mutations

```graphql
# Create restaurant
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
    logoUrl
    bannerUrl
    contactEmail
    phoneNumber
    address
    cuisine
    priceRange
    rating
    reviewCount
    isActive
    openingHours {
      day
      open
      close
      isClosed
    }
    createdAt
    updatedAt
  }
}

# Update restaurant
mutation UpdateRestaurant(
  $id: ID!
  $name: String
  $description: String
  $contactEmail: String
  $phoneNumber: String
  $address: String
  $cuisine: [String!]
  $priceRange: String
  $openingHours: [OpeningHourInput!]
  $isActive: Boolean
) {
  updateRestaurant(
    id: $id
    name: $name
    description: $description
    contactEmail: $contactEmail
    phoneNumber: $phoneNumber
    address: $address
    cuisine: $cuisine
    priceRange: $priceRange
    openingHours: $openingHours
    isActive: $isActive
  ) {
    id
    name
    description
    logoUrl
    bannerUrl
    contactEmail
    phoneNumber
    address
    cuisine
    priceRange
    rating
    reviewCount
    isActive
    openingHours {
      day
      open
      close
      isClosed
    }
    createdAt
    updatedAt
  }
}
```

### Menu Mutations

```graphql
# Create menu item
mutation CreateMenuItem(
  $restaurantId: ID!
  $name: String!
  $description: String!
  $price: Float!
  $category: String!
  $imageUrl: String
  $imageHint: String
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
    imageHint: $imageHint
    isAvailable: $isAvailable
    isVegetarian: $isVegetarian
    isVegan: $isVegan
    allergens: $allergens
  ) {
    id
    restaurantId
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
    createdAt
    updatedAt
  }
}

# Update menu item
mutation UpdateMenuItem(
  $id: ID!
  $name: String
  $description: String
  $price: Float
  $category: String
  $imageUrl: String
  $imageHint: String
  $isAvailable: Boolean
  $isVegetarian: Boolean
  $isVegan: Boolean
  $allergens: [String!]
) {
  updateMenuItem(
    id: $id
    name: $name
    description: $description
    price: $price
    category: $category
    imageUrl: $imageUrl
    imageHint: $imageHint
    isAvailable: $isAvailable
    isVegetarian: $isVegetarian
    isVegan: $isVegan
    allergens: $allergens
  ) {
    id
    restaurantId
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
    createdAt
    updatedAt
  }
}

# Delete menu item
mutation DeleteMenuItem($id: ID!) {
  deleteMenuItem(id: $id)
}

# Create menu category
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
    restaurantId
    name
    description
    displayOrder
    createdAt
    updatedAt
  }
}

# Update menu category
mutation UpdateMenuCategory(
  $id: ID!
  $name: String
  $description: String
  $displayOrder: Int
) {
  updateMenuCategory(
    id: $id
    name: $name
    description: $description
    displayOrder: $displayOrder
  ) {
    id
    restaurantId
    name
    description
    displayOrder
    createdAt
    updatedAt
  }
}

# Delete menu category
mutation DeleteMenuCategory($id: ID!) {
  deleteMenuCategory(id: $id)
}
```

### Order Mutations

```graphql
# Place new order
mutation PlaceOrder(
  $restaurant: String!
  $orderInput: [OrderItemInput!]!
  $paymentMethod: String!
  $couponCode: String
  $tipping: Float
  $taxationAmount: Float
  $address: String
  $orderDate: String!
  $isPickedUp: Boolean
  $deliveryCharges: Float
  $instructions: String
) {
  placeOrder(
    restaurant: $restaurant
    orderInput: $orderInput
    paymentMethod: $paymentMethod
    couponCode: $couponCode
    tipping: $tipping
    taxationAmount: $taxationAmount
    address: $address
    orderDate: $orderDate
    isPickedUp: $isPickedUp
    deliveryCharges: $deliveryCharges
    instructions: $instructions
  ) {
    id
    orderId
    userId
    restaurant
    orderItems {
      id
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
    orderAmount
    paidAmount
    paymentMethod
    orderStatus
    orderDate
    expectedTime
    isPickedUp
    deliveryCharges
    tipping
    taxationAmount
    address
    instructions
    couponCode
    statusHistory {
      status
      timestamp
      note
    }
    createdAt
    updatedAt
  }
}

# Update order status
mutation UpdateOrderStatus(
  $orderId: ID!
  $status: String!
  $note: String
) {
  updateOrderStatus(
    orderId: $orderId
    status: $status
    note: $note
  ) {
    id
    orderId
    userId
    restaurant
    orderItems {
      id
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
    orderAmount
    paidAmount
    paymentMethod
    orderStatus
    orderDate
    expectedTime
    isPickedUp
    deliveryCharges
    tipping
    taxationAmount
    address
    instructions
    couponCode
    statusHistory {
      status
      timestamp
      note
    }
    createdAt
    updatedAt
  }
}
```

### Image Upload Mutations

```graphql
# Upload generic image
mutation UploadImage($file: Upload!, $folder: String) {
  uploadImage(file: $file, folder: $folder)
}

# Upload restaurant logo
mutation UploadRestaurantLogo($restaurantId: ID!, $file: Upload!) {
  uploadRestaurantLogo(restaurantId: $restaurantId, file: $file) {
    id
    name
    logoUrl
    updatedAt
  }
}

# Upload restaurant banner
mutation UploadRestaurantBanner($restaurantId: ID!, $file: Upload!) {
  uploadRestaurantBanner(restaurantId: $restaurantId, file: $file) {
    id
    name
    bannerUrl
    updatedAt
  }
}

# Upload menu item image
mutation UploadMenuItemImage(
  $restaurantId: ID!
  $menuItemId: ID!
  $file: Upload!
) {
  uploadMenuItemImage(
    restaurantId: $restaurantId
    menuItemId: $menuItemId
    file: $file
  ) {
    id
    name
    imageUrl
    updatedAt
  }
}
```

## Integration Examples

### ChopChop Integration

#### Apollo Client Setup

```typescript
// lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getFirebaseAuth } from './firebase/client';

const authLink = setContext(async (_, { headers }) => {
  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        },
      };
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }

  return { headers };
});

const client = new ApolloClient({
  link: from([authLink, new HttpLink({ uri: 'http://localhost:4000/graphql' })]),
  cache: new InMemoryCache(),
});

export default client;
```

#### Restaurant Browsing

```typescript
// Get restaurants
const GET_RESTAURANTS = gql`
  query GetRestaurants($search: String, $cuisine: String, $limit: Int) {
    restaurants(search: $search, cuisine: $cuisine, limit: $limit) {
      id
      name
      description
      cuisine
      isActive
      rating
      reviewCount
      logoUrl
      bannerUrl
      contactEmail
      address
      phoneNumber
      priceRange
    }
  }
`;

// Usage
const { data, loading, error } = useQuery(GET_RESTAURANTS, {
  variables: { search: 'pizza', limit: 20 }
});
```

#### Order Placement

```typescript
// Place order mutation
const PLACE_ORDER = gql`
  mutation PlaceOrder($input: OrderInput!) {
    placeOrder(input: $input) {
      id
      orderId
      status
      total
    }
  }
`;

// Usage
const [placeOrder, { data, loading, error }] = useMutation(PLACE_ORDER);

const handlePlaceOrder = async (orderData) => {
  try {
    const result = await placeOrder({
      variables: {
        input: {
          restaurant: orderData.restaurant,
          orderInput: orderData.items,
          paymentMethod: orderData.paymentMethod,
          orderDate: orderData.orderDate,
          address: orderData.address,
          deliveryCharges: orderData.deliveryCharges,
          tipping: orderData.tipping,
          instructions: orderData.instructions
        }
      }
    });
    console.log('Order placed:', result.data.placeOrder);
  } catch (err) {
    console.error('Order placement failed:', err);
  }
};
```

### MenuVerse Integration

#### Restaurant Management

```typescript
// Create restaurant
const CREATE_RESTAURANT = gql`
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
`;
```

#### Order Status Updates

```typescript
// Update order status
const UPDATE_ORDER_STATUS = gql`
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
`;

// Usage
const [updateStatus] = useMutation(UPDATE_ORDER_STATUS);

const handleStatusUpdate = async (orderId, status, note) => {
  await updateStatus({
    variables: { orderId, status, note }
  });

  // Send webhook to ChopChop
  await sendOrderUpdateWebhook(orderId, status);
};
```

## Error Handling

### GraphQL Errors

```typescript
const { data, loading, error } = useQuery(GET_RESTAURANTS);

if (error) {
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

### Common Error Codes

- `UNAUTHENTICATED`: Missing or invalid auth token
- `FORBIDDEN`: Insufficient permissions
- `BAD_USER_INPUT`: Invalid input data
- `NOT_FOUND`: Resource not found
- `INTERNAL_SERVER_ERROR`: Server error

## Testing

### Test Scripts

```bash
# Test Firebase connection
node test-firebase.js

# Test basic GraphQL queries
node test-simple.js

# Test order placement
node test-place-order.js

# Test status updates
node test-status-updates.js

# Test integrated flow
node test-integrated.js
```

### Integration Testing

```typescript
// tests/integration/order-flow.test.ts
describe('Order Flow Integration', () => {
  it('should handle complete order lifecycle', async () => {
    // 1. Create restaurant
    const restaurant = await createRestaurant(testData.restaurant);

    // 2. Add menu items
    const menuItem = await createMenuItem({
      ...testData.menuItem,
      restaurantId: restaurant.id
    });

    // 3. Place order
    const order = await placeOrder({
      restaurant: restaurant.name,
      orderInput: [{
        title: menuItem.name,
        food: menuItem.category,
        description: menuItem.description,
        quantity: 1,
        price: menuItem.price,
        total: menuItem.price
      }],
      paymentMethod: 'CASH',
      orderDate: new Date().toISOString()
    });

    // 4. Update status
    const updatedOrder = await updateOrderStatus({
      orderId: order.id,
      status: 'CONFIRMED',
      note: 'Order confirmed'
    });

    expect(updatedOrder.orderStatus).toBe('CONFIRMED');
  });
});
```

## Performance Optimization

### Query Optimization

- Request only needed fields
- Use pagination for large datasets
- Implement proper caching strategies
- Batch multiple operations when possible

### Real-time Updates

- Use Firebase listeners for real-time data
- Implement debouncing for frequent updates
- Handle connection drops gracefully
- Optimize listener cleanup

## Security Considerations

### Authentication

- Use Firebase Auth for user authentication
- Validate JWT tokens on each request
- Implement proper session management
- Handle token refresh automatically

### Authorization

- Check user ownership for resource access
- Implement role-based permissions
- Validate input data thoroughly
- Use parameterized queries to prevent injection

### Data Validation

- Validate all input data on server-side
- Implement proper type checking
- Sanitize user inputs
- Handle file upload restrictions

## Deployment

### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=production

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# External Services
IMGBB_API_KEY=your-imgbb-key
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/.well-known/apollo/server-health || exit 1

CMD ["npm", "start"]
```

## Monitoring & Maintenance

### Health Checks

- Apollo Server health endpoint
- Firebase connection monitoring
- Database performance metrics
- Error rate tracking

### Logging

- Request/response logging
- Error tracking with stack traces
- Performance metrics
- Audit logs for sensitive operations

### Backup & Recovery

- Regular database backups
- Firebase data export capabilities
- Disaster recovery procedures
- Data retention policies</content>
<parameter name="filePath">/workspaces/food-delivery-multivendor/api/ENHANCED-API-DOCUMENTATION.md