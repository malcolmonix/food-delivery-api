const { gql } = require('apollo-server-express');
const { dbHelpers, generateId } = require('./database');
const { admin } = require('./firebase');
const axios = require('axios');
const FormData = require('form-data');
const DELIVERMI_URL = process.env.DELIVERMI_URL || 'http://localhost:9010';

const typeDefs = gql`
  scalar Upload

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
    isVegetarian: Boolean
    isVegan: Boolean
    allergens: [String!]
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

  type AuthPayload {
    user: User!
    token: String!
  }

  type OrderItem {
    id: ID
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
    riderId: String
    pickupCode: String
    paymentProcessed: Boolean
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

  type StatusUpdate {
    status: String!
    timestamp: String!
    note: String
  }

  type Query {
    me: User
    orders: [Order!]!
    order(id: ID!): Order
    addresses: [Address!]!
    address(id: ID!): Address
    restaurants(search: String, cuisine: String, limit: Int, offset: Int): [Restaurant!]!
    restaurant(id: ID!): Restaurant
    menuItems(restaurantId: ID!): [MenuItem!]!
    menuItem(id: ID!): MenuItem
    menuCategories(restaurantId: ID!): [MenuCategory!]!
    # Orders available for riders to accept
    availableOrders: [Order!]!
  }

  type Mutation {
    signUp(
      email: String!
      password: String!
      displayName: String
      phoneNumber: String
    ): AuthPayload!
    signIn(
      email: String!
      password: String!
    ): AuthPayload!
    signInWithGoogle(idToken: String!): AuthPayload!
    signInWithPhone(phoneNumber: String!, verificationId: String!, code: String!): AuthPayload!
    updateProfile(displayName: String, phoneNumber: String, photoURL: String): User!
    addAddress(
      label: String!
      street: String!
      city: String!
      state: String!
      zipCode: String!
      country: String!
      isDefault: Boolean
    ): Address!
    updateAddress(
      id: ID!
      label: String
      street: String
      city: String
      state: String
      zipCode: String
      country: String
      isDefault: Boolean
    ): Address!
    deleteAddress(id: ID!): Boolean!
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
    updateOrderStatus(
      orderId: ID!
      status: String!
      note: String
    ): Order!
    createRestaurant(
      name: String!
      description: String!
      contactEmail: String
      phoneNumber: String
      address: String
      cuisine: [String!]
      priceRange: String
      openingHours: [OpeningHourInput!]
    ): Restaurant!
    updateRestaurant(
      id: ID!
      name: String
      description: String
      contactEmail: String
      phoneNumber: String
      address: String
      cuisine: [String!]
      priceRange: String
      openingHours: [OpeningHourInput!]
      isActive: Boolean
    ): Restaurant!
    createMenuItem(
      restaurantId: ID!
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
    ): MenuItem!
    updateMenuItem(
      id: ID!
      name: String
      description: String
      price: Float
      category: String
      imageUrl: String
      imageHint: String
      isAvailable: Boolean
      isVegetarian: Boolean
      isVegan: Boolean
      allergens: [String!]
    ): MenuItem!
    deleteMenuItem(id: ID!): Boolean!
    createMenuCategory(
      restaurantId: ID!
      name: String!
      description: String
      displayOrder: Int
    ): MenuCategory!
    updateMenuCategory(
      id: ID!
      name: String
      description: String
      displayOrder: Int
    ): MenuCategory!
    deleteMenuCategory(id: ID!): Boolean!
    uploadImage(file: Upload!, folder: String): String!
    uploadRestaurantLogo(restaurantId: ID!, file: Upload!): Restaurant!
    uploadRestaurantBanner(restaurantId: ID!, file: Upload!): Restaurant!
    uploadMenuItemImage(restaurantId: ID!, menuItemId: ID!, file: Upload!): MenuItem!
    # Rider workflows
    assignRider(orderId: ID!): Order!
    riderUpdateOrderStatus(orderId: ID!, status: String!, code: String): Order!
  }

  input OpeningHourInput {
    day: String!
    open: String!
    close: String!
    isClosed: Boolean!
  }

  input RestaurantInput {
    name: String!
    description: String!
    contactEmail: String
    phoneNumber: String
    address: String
    cuisine: [String!]
    priceRange: String
    openingHours: [OpeningHourInput!]
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
`;

const resolvers = {
  Query: {
    /**
     * Get current authenticated user profile
     */
    me: async (_, __, { user }) => {
      if (!user) return null;
      return getUserById(user.uid);
    },
    /**
     * Get all orders for authenticated user
     */
    orders: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      const orders = dbHelpers.getOrdersByUserId(user.uid);
      return orders.map(order => ({
        ...order,
        orderItems: JSON.parse(order.orderItems),
        statusHistory: JSON.parse(order.statusHistory),
        isPickedUp: Boolean(order.isPickedUp),
      }));
    },
    /**
     * Get single order by ID
     */
    order: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      const order = dbHelpers.getOrderById(id);
      if (!order) return null;
      if (order.userId !== user.uid) throw new Error('Access denied');

      return {
        ...order,
        orderItems: JSON.parse(order.orderItems),
        statusHistory: JSON.parse(order.statusHistory),
        isPickedUp: Boolean(order.isPickedUp),
      };
    },
    /**
     * Get all addresses for authenticated user
     */
    addresses: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      const addresses = dbHelpers.getAddressesByUserId(user.uid);
      return addresses.map(addr => ({
        ...addr,
        isDefault: Boolean(addr.isDefault),
      }));
    },
    /**
     * Get single address by ID
     */
    address: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');
      
      const address = dbHelpers.getAddressById(id);
      if (!address) return null;
      if (address.userId !== user.uid) throw new Error('Access denied');

      return {
        ...address,
        isDefault: Boolean(address.isDefault),
      };
    },
    /**
     * Search and list restaurants
     */
    restaurants: async (_, { search, cuisine, limit = 20, offset = 0 }) => {
      try {
        const restaurants = dbHelpers.getRestaurants({ search, cuisine, limit, offset, isActive: true });
        return restaurants.map(r => ({
          ...r,
          cuisine: JSON.parse(r.cuisine || '[]'),
          openingHours: JSON.parse(r.openingHours || '[]'),
          isActive: Boolean(r.isActive),
        }));
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw new Error('Failed to fetch restaurants');
      }
    },
    /**
     * Get single restaurant by ID
     */
    restaurant: async (_, { id }) => {
      try {
        const restaurant = dbHelpers.getRestaurantById(id);
        if (!restaurant) return null;

        return {
          ...restaurant,
          cuisine: JSON.parse(restaurant.cuisine || '[]'),
          openingHours: JSON.parse(restaurant.openingHours || '[]'),
          isActive: Boolean(restaurant.isActive),
        };
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw new Error('Failed to fetch restaurant');
      }
    },
    /**
     * Get menu items for a restaurant
     */
    menuItems: async (_, { restaurantId }) => {
      try {
        const items = dbHelpers.getMenuItemsByRestaurantId(restaurantId);
        return items.map(item => ({
          ...item,
          allergens: JSON.parse(item.allergens || '[]'),
          isAvailable: Boolean(item.isAvailable),
          isVegetarian: Boolean(item.isVegetarian),
          isVegan: Boolean(item.isVegan),
        }));
      } catch (error) {
        console.error('Error fetching menu items:', error);
        throw new Error('Failed to fetch menu items');
      }
    },
    /**
     * Get single menu item by ID
     */
    menuItem: async (_, { id }) => {
      try {
        const item = dbHelpers.getMenuItemById(id);
        if (!item) return null;

        return {
          ...item,
          allergens: JSON.parse(item.allergens || '[]'),
          isAvailable: Boolean(item.isAvailable),
          isVegetarian: Boolean(item.isVegetarian),
          isVegan: Boolean(item.isVegan),
        };
      } catch (error) {
        console.error('Error fetching menu item:', error);
        throw new Error('Failed to fetch menu item');
      }
    },
    /**
     * Get menu categories for a restaurant
     */
    menuCategories: async (_, { restaurantId }) => {
      try {
        return dbHelpers.getMenuCategoriesByRestaurantId(restaurantId);
      } catch (error) {
        console.error('Error fetching menu categories:', error);
        throw new Error('Failed to fetch menu categories');
      }
    },
    /**
     * Get orders available for riders (unassigned)
     */
    availableOrders: async () => {
      try {
        const orders = dbHelpers.getAvailableOrders();
        return orders.map(order => ({
          ...order,
          orderItems: JSON.parse(order.orderItems),
          statusHistory: JSON.parse(order.statusHistory),
          isPickedUp: Boolean(order.isPickedUp),
          paymentProcessed: Boolean(order.paymentProcessed),
        }));
      } catch (error) {
        console.error('Error fetching available orders:', error);
        throw new Error('Failed to fetch available orders');
      }
    },
  },
  Mutation: {
    /**
     * Sign up a new user with Firebase Auth and store profile in SQLite
     */
    signUp: async (_, { email, password, displayName, phoneNumber }) => {
      try {
        const userData = {
          email,
          password,
          displayName,
        };

        if (phoneNumber) {
          userData.phoneNumber = phoneNumber;
        }

        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser(userData);

        // Store user profile in SQLite (not Firebase password field)
        const profileData = {
          uid: userRecord.uid,
          email: userRecord.email,
          password: '', // Don't store password in SQLite, Firebase handles it
          displayName: userRecord.displayName || null,
          phoneNumber: userRecord.phoneNumber || null,
          photoURL: userRecord.photoURL || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dbHelpers.createUser(profileData);

        // Generate Firebase custom token
        const token = await admin.auth().createCustomToken(userRecord.uid);

        return {
          user: {
            id: userRecord.uid,
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || null,
            phoneNumber: userRecord.phoneNumber || null,
            photoURL: userRecord.photoURL || null,
            addresses: [],
            createdAt: profileData.createdAt,
            updatedAt: profileData.updatedAt,
          },
          token,
        };
      } catch (error) {
        console.error('Error signing up:', error);
        throw new Error('Failed to sign up: ' + error.message);
      }
    },
    /**
     * Sign in with Firebase Auth
     */
    signIn: async (_, { email, password }) => {
      try {
        // Get user from Firebase Auth by email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Generate custom token
        const token = await admin.auth().createCustomToken(userRecord.uid);
        
        // Get user profile from SQLite
        const user = await getUserById(userRecord.uid);

        return { user, token };
      } catch (error) {
        console.error('Error signing in:', error);
        throw new Error('Failed to sign in: ' + error.message);
      }
    },
    /**
     * Sign in with Google using Firebase Auth
     */
    signInWithGoogle: async (_, { idToken }) => {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check if user profile exists in SQLite
        let user = await getUserById(uid);
        if (!user) {
          // Get user from Firebase Auth
          const userRecord = await admin.auth().getUser(uid);
          
          // Create profile in SQLite
          const userData = {
            uid: userRecord.uid,
            email: userRecord.email,
            password: '', // Firebase handles authentication
            displayName: userRecord.displayName || null,
            phoneNumber: userRecord.phoneNumber || null,
            photoURL: userRecord.photoURL || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          dbHelpers.createUser(userData);
          user = await getUserById(uid);
        }

        const token = await admin.auth().createCustomToken(uid);
        return { user, token };
      } catch (error) {
        console.error('Error signing in with Google:', error);
        throw new Error('Failed to sign in with Google: ' + error.message);
      }
    },
    /**
     * Sign in with phone number using Firebase Auth
     */
    signInWithPhone: async (_, { phoneNumber, verificationId, code }) => {
      try {
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
        const token = await admin.auth().createCustomToken(userRecord.uid);
        const user = await getUserById(userRecord.uid);

        return { user, token };
      } catch (error) {
        console.error('Error signing in with phone:', error);
        throw new Error('Failed to sign in with phone: ' + error.message);
      }
    },
    /**
     * Update user profile in both Firebase Auth and SQLite
     */
    updateProfile: async (_, { displayName, phoneNumber, photoURL }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const updateData = { updatedAt: new Date().toISOString() };
        if (displayName !== undefined) updateData.displayName = displayName;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (photoURL !== undefined) updateData.photoURL = photoURL;

        // Update in SQLite
        dbHelpers.updateUser(user.uid, updateData);

        // Update in Firebase Auth
        const authUpdateData = {};
        if (displayName !== undefined) authUpdateData.displayName = displayName;
        if (phoneNumber !== undefined) authUpdateData.phoneNumber = phoneNumber;
        if (photoURL !== undefined) authUpdateData.photoURL = photoURL;
        
        await admin.auth().updateUser(user.uid, authUpdateData);

        return await getUserById(user.uid);
      } catch (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile: ' + error.message);
      }
    },
    /**
     * Add a new address
     */
    addAddress: async (_, { label, street, city, state, zipCode, country, isDefault }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const addressData = {
          userId: user.uid,
          label,
          street,
          city,
          state,
          zipCode,
          country,
          isDefault: isDefault || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (isDefault) {
          dbHelpers.unsetDefaultAddresses(user.uid);
        }

        const id = dbHelpers.createAddress(addressData);

        return {
          id,
          ...addressData,
        };
      } catch (error) {
        console.error('Error adding address:', error);
        throw new Error('Failed to add address: ' + error.message);
      }
    },
    /**
     * Update an existing address
     */
    updateAddress: async (_, { id, label, street, city, state, zipCode, country, isDefault }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const address = dbHelpers.getAddressById(id);
        if (!address) throw new Error('Address not found');
        if (address.userId !== user.uid) throw new Error('Access denied');

        const updateData = { updatedAt: new Date().toISOString() };
        if (label !== undefined) updateData.label = label;
        if (street !== undefined) updateData.street = street;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (zipCode !== undefined) updateData.zipCode = zipCode;
        if (country !== undefined) updateData.country = country;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        if (isDefault) {
          dbHelpers.unsetDefaultAddresses(user.uid);
        }

        dbHelpers.updateAddress(id, updateData);

        const updatedAddress = dbHelpers.getAddressById(id);
        return {
          ...updatedAddress,
          isDefault: Boolean(updatedAddress.isDefault),
        };
      } catch (error) {
        console.error('Error updating address:', error);
        throw new Error('Failed to update address: ' + error.message);
      }
    },
    /**
     * Delete an address
     */
    deleteAddress: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const address = dbHelpers.getAddressById(id);
        if (!address) throw new Error('Address not found');
        if (address.userId !== user.uid) throw new Error('Access denied');

        dbHelpers.deleteAddress(id);
        return true;
      } catch (error) {
        console.error('Error deleting address:', error);
        throw new Error('Failed to delete address: ' + error.message);
      }
    },
    /**
     * Place a new order
     */
    placeOrder: async (_, {
      restaurant,
      orderInput,
      paymentMethod,
      couponCode,
      tipping,
      taxationAmount,
      address,
      orderDate,
      isPickedUp,
      deliveryCharges,
      instructions
    }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Calculate total amount
        const orderAmount = orderInput.reduce((total, item) => total + item.total, 0);
        const totalCharges = (deliveryCharges || 0) + (tipping || 0) + (taxationAmount || 0);
        const paidAmount = orderAmount + totalCharges;

        // Determine order status based on payment method
        let orderStatus;
        if (paymentMethod === 'CASH') {
          orderStatus = 'CONFIRMED'; // Cash orders are immediately confirmed
        } else {
          // CARD, WALLET, BANK - require payment processing
          orderStatus = 'PENDING_PAYMENT';
        }

        // Generate order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const orderData = {
          orderId,
          userId: user.uid,
          restaurant,
          orderItems: orderInput,
          orderAmount,
          paidAmount,
          paymentMethod,
          orderStatus,
          orderDate,
          expectedTime: null,
          isPickedUp: isPickedUp || false,
          deliveryCharges: deliveryCharges || 0,
          tipping: tipping || 0,
          taxationAmount: taxationAmount || 0,
          address: address || null,
          instructions: instructions || null,
          couponCode: couponCode || null,
          statusHistory: [{
            status: orderStatus,
            timestamp: new Date().toISOString(),
            note: `Order placed with ${paymentMethod} payment`
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to SQLite
        console.log('Attempting to save order to database...');
        const id = dbHelpers.createOrder(orderData);
        console.log('Order saved successfully with ID:', id);

        // Send push notification to riders via FCM when a new available order is placed
        try {
          if (admin && admin.messaging && admin.firestore) {
            const firestore = admin.firestore();
            const ridersSnapshot = await firestore.collection('riders').get();
            const tokens = [];
            ridersSnapshot.forEach(doc => {
              const data = doc.data();
              if (data && data.fcmToken) tokens.push(data.fcmToken);
            });

            if (tokens.length) {
              const deepLink = `${DELIVERMI_URL.replace(/\/$/, '')}/order/${encodeURIComponent(id.toString())}`;
              const message = {
                notification: {
                  title: 'New delivery available',
                  body: `${restaurant} — ${orderInput.length} item(s)`,
                },
                data: { orderId: id.toString(), type: 'NEW_ORDER', url: deepLink },
              };

              // chunk tokens to avoid size limits
              const chunkSize = 500;
              for (let i = 0; i < tokens.length; i += chunkSize) {
                const chunk = tokens.slice(i, i + chunkSize);
                try {
                  await admin.messaging().sendMulticast({ tokens: chunk, ...message });
                } catch (sendErr) {
                  console.warn('FCM sendMulticast failed for chunk:', sendErr.message || sendErr);
                }
              }
            }
          }
        } catch (notifyErr) {
          console.warn('Failed to send rider notifications:', notifyErr.message || notifyErr);
        }

        return {
          id,
          ...orderData,
        };
      } catch (error) {
        console.error('Error placing order:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw new Error('Failed to place order: ' + error.message);
      }
    },
    /**
     * Update order status
     */
    updateOrderStatus: async (_, { orderId, status, note }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Validate status transition
        const validStatuses = [
          'PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'READY',
          'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
        ];

        if (!validStatuses.includes(status)) {
          throw new Error(`Invalid status: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
        }

        // Get current order
        const currentOrder = dbHelpers.getOrderById(orderId);

        if (!currentOrder) {
          throw new Error('Order not found');
        }

        // Check if order belongs to user OR the user is the restaurant owner
        let isAllowedToUpdate = false;
        if (currentOrder.userId === user.uid) isAllowedToUpdate = true;
        try {
          const maybeRestaurant = dbHelpers.getRestaurantById(currentOrder.restaurant);
          if (maybeRestaurant && maybeRestaurant.ownerId === user.uid) isAllowedToUpdate = true;
        } catch (e) {
          // ignore - restaurant lookup may fail if restaurant stored as name
        }

        if (!isAllowedToUpdate) {
          throw new Error('Access denied: Can only update your own orders or orders for your restaurant');
        }

        const currentStatus = currentOrder.orderStatus;

        // Prevent invalid transitions
        if (currentStatus === 'DELIVERED' && status !== 'DELIVERED') {
          throw new Error('Cannot change status of delivered order');
        }

        if (currentStatus === 'CANCELLED') {
          throw new Error('Cannot update cancelled order');
        }

        // Update order with new status
        const statusUpdate = {
          status,
          timestamp: new Date().toISOString(),
          note: note || `Status updated to ${status}`
        };

        const statusHistory = JSON.parse(currentOrder.statusHistory);
        const updatedStatusHistory = [...statusHistory, statusUpdate];

        dbHelpers.updateOrder(orderId, {
          orderStatus: status,
          statusHistory: updatedStatusHistory,
          updatedAt: new Date().toISOString(),
        });

        console.log(`Order ${orderId} status updated: ${currentStatus} → ${status}`);

        // Notify riders when order enters preparing/processing or ready/out-for-delivery states
        try {
          const notifyStatuses = ['PROCESSING', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'];
          if (notifyStatuses.includes(status) && admin && admin.messaging && admin.firestore) {
            const updated = dbHelpers.getOrderById(orderId);

            // Fetch customer info if available
            let customer = null;
            try { customer = await getUserById(updated.userId); } catch (e) { customer = null; }

            // Try to fetch restaurant details if restaurant value looks like an id
            let vendor = null;
            try {
              const maybeVendor = dbHelpers.getRestaurantById(updated.restaurant);
              if (maybeVendor) vendor = maybeVendor;
            } catch (e) {
              vendor = null;
            }

            const pickupAddress = (vendor && vendor.address) || updated.address || '';
            const dropoffAddress = updated.address || '';

            // Determine messaging content based on stage
            let title = 'Order update';
            let body = `${(vendor && vendor.name) || updated.restaurant || 'Order'} — ${dropoffAddress}`;
            let dataType = 'ORDER_UPDATE';
            if (['PROCESSING', 'PREPARING'].includes(status)) {
              title = 'Order preparing — early pickup available';
              body = `${(vendor && vendor.name) || updated.restaurant || 'Vendor'} is preparing the order. Pick up early to be first.`;
              dataType = 'ORDER_PREPARING';
            } else if (['READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(status)) {
              title = 'Order ready for pickup';
              body = `${(vendor && vendor.name) || updated.restaurant || 'Vendor'} — ${pickupAddress || dropoffAddress}`;
              dataType = 'ORDER_READY';
            }

            // Collect tokens for available riders
            const firestore = admin.firestore();
            const ridersSnapshot = await firestore.collection('riders').get();
            const tokens = [];
            ridersSnapshot.forEach(doc => {
              const data = doc.data();
              if (data && data.fcmToken && (data.available === undefined || data.available === true)) tokens.push(data.fcmToken);
            });

            if (tokens.length) {
              const deepLink = `${DELIVERMI_URL.replace(/\/$/, '')}/order/${encodeURIComponent(updated.id.toString())}`;
              const payload = {
                notification: {
                  title,
                  body,
                },
                data: {
                  type: dataType,
                  orderId: updated.id.toString(),
                  pickupAddress: pickupAddress,
                  dropoffAddress: dropoffAddress,
                  customerName: customer ? customer.displayName || customer.email || '' : '',
                  customerContact: customer ? (customer.phoneNumber || customer.email || '') : '',
                  vendorName: vendor ? vendor.name || '' : (updated.restaurant || ''),
                  vendorContact: vendor ? (vendor.phoneNumber || vendor.contactEmail || '') : '',
                  url: deepLink,
                }
              };

              const chunkSize = 500;
              for (let i = 0; i < tokens.length; i += chunkSize) {
                const chunk = tokens.slice(i, i + chunkSize);
                try {
                  await admin.messaging().sendMulticast({ tokens: chunk, ...payload });
                } catch (err) {
                  console.warn('Failed sending notification chunk:', err.message || err);
                }
              }
            }
          }
        } catch (notifyErr) {
          console.warn('Error sending notifications:', notifyErr.message || notifyErr);
        }

        // Return updated order
        const updatedOrder = dbHelpers.getOrderById(orderId);
        return {
          ...updatedOrder,
          orderItems: JSON.parse(updatedOrder.orderItems),
          statusHistory: JSON.parse(updatedOrder.statusHistory),
          isPickedUp: Boolean(updatedOrder.isPickedUp),
        };
      } catch (error) {
        console.error('Error updating order status:', error);
        throw new Error('Failed to update order status: ' + error.message);
      }
    },
    /**
     * Create a new restaurant
     */
    createRestaurant: async (_, { name, description, contactEmail, phoneNumber, address, cuisine, priceRange, openingHours }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const restaurantData = {
          name,
          description,
          contactEmail: contactEmail || null,
          phoneNumber: phoneNumber || null,
          address: address || null,
          cuisine: cuisine || [],
          priceRange: priceRange || null,
          openingHours: openingHours || [],
          isActive: true,
          rating: null,
          reviewCount: 0,
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const id = dbHelpers.createRestaurant(restaurantData);

        return {
          id,
          ...restaurantData,
        };
      } catch (error) {
        console.error('Error creating restaurant:', error);
        throw new Error('Failed to create restaurant: ' + error.message);
      }
    },
    /**
     * Update a restaurant
     */
    updateRestaurant: async (_, { id, name, description, contactEmail, phoneNumber, address, cuisine, priceRange, openingHours, isActive }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const restaurant = dbHelpers.getRestaurantById(id);
        if (!restaurant) throw new Error('Restaurant not found');
        if (restaurant.ownerId !== user.uid) throw new Error('Access denied: Can only update your own restaurants');

        const updateData = { updatedAt: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (address !== undefined) updateData.address = address;
        if (cuisine !== undefined) updateData.cuisine = cuisine;
        if (priceRange !== undefined) updateData.priceRange = priceRange;
        if (openingHours !== undefined) updateData.openingHours = openingHours;
        if (isActive !== undefined) updateData.isActive = isActive;

        dbHelpers.updateRestaurant(id, updateData);

        const updatedRestaurant = dbHelpers.getRestaurantById(id);
        return {
          ...updatedRestaurant,
          cuisine: JSON.parse(updatedRestaurant.cuisine || '[]'),
          openingHours: JSON.parse(updatedRestaurant.openingHours || '[]'),
          isActive: Boolean(updatedRestaurant.isActive),
        };
      } catch (error) {
        console.error('Error updating restaurant:', error);
        throw new Error('Failed to update restaurant: ' + error.message);
      }
    },
    /**
     * Create a new menu item
     */
    createMenuItem: async (_, { restaurantId, name, description, price, category, imageUrl, imageHint, isAvailable, isVegetarian, isVegan, allergens }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(restaurantId);
        if (!restaurant) throw new Error('Restaurant not found');
        if (restaurant.ownerId !== user.uid) throw new Error('Access denied: Can only manage menu for your own restaurants');

        const menuItemData = {
          restaurantId,
          name,
          description: description || '',
          price: parseFloat(price),
          category: category || 'Main Course',
          imageUrl: imageUrl || null,
          imageHint: imageHint || null,
          isAvailable: isAvailable !== false,
          isVegetarian: isVegetarian || false,
          isVegan: isVegan || false,
          allergens: allergens || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const id = dbHelpers.createMenuItem(menuItemData);

        return {
          id,
          ...menuItemData,
        };
      } catch (error) {
        console.error('Error creating menu item:', error);
        throw new Error('Failed to create menu item: ' + error.message);
      }
    },
    /**
     * Update a menu item
     */
    updateMenuItem: async (_, { id, name, description, price, category, imageUrl, imageHint, isAvailable, isVegetarian, isVegan, allergens }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Get menu item
        const menuItem = dbHelpers.getMenuItemById(id);
        if (!menuItem) throw new Error('Menu item not found');

        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(menuItem.restaurantId);
        if (!restaurant || restaurant.ownerId !== user.uid) {
          throw new Error('Access denied: Can only manage menu for your own restaurants');
        }

        const updateData = { updatedAt: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (category !== undefined) updateData.category = category;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (imageHint !== undefined) updateData.imageHint = imageHint;
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
        if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian;
        if (isVegan !== undefined) updateData.isVegan = isVegan;
        if (allergens !== undefined) updateData.allergens = allergens;

        dbHelpers.updateMenuItem(id, updateData);

        const updatedMenuItem = dbHelpers.getMenuItemById(id);
        return {
          ...updatedMenuItem,
          allergens: JSON.parse(updatedMenuItem.allergens || '[]'),
          isAvailable: Boolean(updatedMenuItem.isAvailable),
          isVegetarian: Boolean(updatedMenuItem.isVegetarian),
          isVegan: Boolean(updatedMenuItem.isVegan),
        };
      } catch (error) {
        console.error('Error updating menu item:', error);
        throw new Error('Failed to update menu item: ' + error.message);
      }
    },
    /**
     * Delete a menu item
     */
    deleteMenuItem: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Get menu item
        const menuItem = dbHelpers.getMenuItemById(id);
        if (!menuItem) throw new Error('Menu item not found');

        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(menuItem.restaurantId);
        if (!restaurant || restaurant.ownerId !== user.uid) {
          throw new Error('Access denied: Can only manage menu for your own restaurants');
        }

        dbHelpers.deleteMenuItem(id);
        return true;
      } catch (error) {
        console.error('Error deleting menu item:', error);
        throw new Error('Failed to delete menu item: ' + error.message);
      }
    },
    /**
     * Create a new menu category
     */
    createMenuCategory: async (_, { restaurantId, name, description, displayOrder }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(restaurantId);
        if (!restaurant) throw new Error('Restaurant not found');
        if (restaurant.ownerId !== user.uid) throw new Error('Access denied: Can only manage categories for your own restaurants');

        const categoryData = {
          restaurantId,
          name,
          description: description || '',
          displayOrder: displayOrder || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const id = dbHelpers.createMenuCategory(categoryData);

        return {
          id,
          ...categoryData,
        };
      } catch (error) {
        console.error('Error creating menu category:', error);
        throw new Error('Failed to create menu category: ' + error.message);
      }
    },
    /**
     * Update a menu category
     */
    updateMenuCategory: async (_, { id, name, description, displayOrder }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Get category
        const category = dbHelpers.getMenuCategoryById(id);
        if (!category) throw new Error('Menu category not found');

        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(category.restaurantId);
        if (!restaurant || restaurant.ownerId !== user.uid) {
          throw new Error('Access denied: Can only manage categories for your own restaurants');
        }

        const updateData = { updatedAt: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

        dbHelpers.updateMenuCategory(id, updateData);

        const updatedCategory = dbHelpers.getMenuCategoryById(id);
        return {
          ...updatedCategory,
          restaurantId: category.restaurantId,
        };
      } catch (error) {
        console.error('Error updating menu category:', error);
        throw new Error('Failed to update menu category: ' + error.message);
      }
    },
    /**
     * Delete a menu category
     */
    deleteMenuCategory: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Get category
        const category = dbHelpers.getMenuCategoryById(id);
        if (!category) throw new Error('Menu category not found');

        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(category.restaurantId);
        if (!restaurant || restaurant.ownerId !== user.uid) {
          throw new Error('Access denied: Can only manage categories for your own restaurants');
        }

        dbHelpers.deleteMenuCategory(id);
        return true;
      } catch (error) {
        console.error('Error deleting menu category:', error);
        throw new Error('Failed to delete menu category: ' + error.message);
      }
    },
    /**
     * Upload an image to imgbb
     * @param {Upload} file - File to upload
     * @param {string} folder - Optional folder path (defaults to 'images')
     * @returns {Promise<string>} Public URL of uploaded image
     */
    uploadImage: async (_, { file, folder }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const imageUrl = await uploadFileToStorage(file, folder || 'images');
        return imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image: ' + error.message);
      }
    },
    /**
     * Upload restaurant logo and update restaurant
     * @param {ID} restaurantId - Restaurant ID
     * @param {Upload} file - Logo image file
     * @returns {Promise<Restaurant>} Updated restaurant
     */
    uploadRestaurantLogo: async (_, { restaurantId, file }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(restaurantId);
        if (!restaurant) throw new Error('Restaurant not found');
        if (restaurant.ownerId !== user.uid) throw new Error('Access denied: Can only update your own restaurants');

        // Upload logo
        const logoUrl = await uploadFileToStorage(file, `restaurants-${restaurantId}-logo`);

        // Update restaurant
        dbHelpers.updateRestaurant(restaurantId, {
          logoUrl,
          updatedAt: new Date().toISOString(),
        });

        const updatedRestaurant = dbHelpers.getRestaurantById(restaurantId);
        return {
          ...updatedRestaurant,
          cuisine: JSON.parse(updatedRestaurant.cuisine || '[]'),
          openingHours: JSON.parse(updatedRestaurant.openingHours || '[]'),
          isActive: Boolean(updatedRestaurant.isActive),
        };
      } catch (error) {
        console.error('Error uploading restaurant logo:', error);
        throw new Error('Failed to upload restaurant logo: ' + error.message);
      }
    },
    /**
     * Upload restaurant banner and update restaurant
     * @param {ID} restaurantId - Restaurant ID
     * @param {Upload} file - Banner image file
     * @returns {Promise<Restaurant>} Updated restaurant
     */
    uploadRestaurantBanner: async (_, { restaurantId, file }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(restaurantId);
        if (!restaurant) throw new Error('Restaurant not found');
        if (restaurant.ownerId !== user.uid) throw new Error('Access denied: Can only update your own restaurants');

        // Upload banner
        const bannerUrl = await uploadFileToStorage(file, `restaurants-${restaurantId}-banner`);

        // Update restaurant
        dbHelpers.updateRestaurant(restaurantId, {
          bannerUrl,
          updatedAt: new Date().toISOString(),
        });

        const updatedRestaurant = dbHelpers.getRestaurantById(restaurantId);
        return {
          ...updatedRestaurant,
          cuisine: JSON.parse(updatedRestaurant.cuisine || '[]'),
          openingHours: JSON.parse(updatedRestaurant.openingHours || '[]'),
          isActive: Boolean(updatedRestaurant.isActive),
        };
      } catch (error) {
        console.error('Error uploading restaurant banner:', error);
        throw new Error('Failed to upload restaurant banner: ' + error.message);
      }
    },
    /**
     * Upload menu item image and update menu item
     * @param {ID} restaurantId - Restaurant ID
     * @param {ID} menuItemId - Menu item ID
     * @param {Upload} file - Menu item image file
     * @returns {Promise<MenuItem>} Updated menu item
     */
    uploadMenuItemImage: async (_, { restaurantId, menuItemId, file }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify restaurant ownership
        const restaurant = dbHelpers.getRestaurantById(restaurantId);
        if (!restaurant) throw new Error('Restaurant not found');
        if (restaurant.ownerId !== user.uid) throw new Error('Access denied: Can only manage menu for your own restaurants');

        // Get menu item
        const menuItem = dbHelpers.getMenuItemById(menuItemId);
        if (!menuItem || menuItem.restaurantId !== restaurantId) {
          throw new Error('Menu item not found');
        }

        // Upload image
        const imageUrl = await uploadFileToStorage(file, `menu-items-${menuItemId}`);

        // Update menu item
        dbHelpers.updateMenuItem(menuItemId, {
          imageUrl,
          updatedAt: new Date().toISOString(),
        });

        const updatedMenuItem = dbHelpers.getMenuItemById(menuItemId);
        return {
          ...updatedMenuItem,
          allergens: JSON.parse(updatedMenuItem.allergens || '[]'),
          isAvailable: Boolean(updatedMenuItem.isAvailable),
          isVegetarian: Boolean(updatedMenuItem.isVegetarian),
          isVegan: Boolean(updatedMenuItem.isVegan),
        };
      } catch (error) {
        console.error('Error uploading menu item image:', error);
        throw new Error('Failed to upload menu item image: ' + error.message);
      }
    },
    /**
     * Assign a rider to an order
     */
    assignRider: async (_, { orderId }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const order = dbHelpers.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        if (order.riderId) throw new Error('Order already assigned');

        // Generate a 6-digit pickup code for verification
        const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

        dbHelpers.updateOrder(orderId, {
          riderId: user.uid,
          pickupCode,
          orderStatus: 'ASSIGNED',
          updatedAt: new Date().toISOString(),
        });

        const updated = dbHelpers.getOrderById(orderId);
        return {
          ...updated,
          orderItems: JSON.parse(updated.orderItems),
          statusHistory: JSON.parse(updated.statusHistory),
          isPickedUp: Boolean(updated.isPickedUp),
          paymentProcessed: Boolean(updated.paymentProcessed),
        };
      } catch (error) {
        console.error('Error assigning rider:', error);
        throw new Error('Failed to assign rider: ' + error.message);
      }
    },

    /**
     * Rider updates order status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
     */
    riderUpdateOrderStatus: async (_, { orderId, status, code }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const order = dbHelpers.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        if (!order.riderId || order.riderId !== user.uid) throw new Error('Access denied: Not assigned to this rider');

        // If delivering, verify code
        if (status === 'DELIVERED') {
          if (!code) throw new Error('Delivery code required');
          if (order.pickupCode !== code) throw new Error('Invalid delivery code');
        }

        const now = new Date().toISOString();
        const statusHistory = JSON.parse(order.statusHistory || '[]');
        statusHistory.push({ status, timestamp: now, note: `Rider ${user.uid} set status ${status}` });

        const updates = {
          orderStatus: status,
          statusHistory,
          updatedAt: now,
        };

        if (status === 'PICKED_UP') {
          updates.isPickedUp = true;
        }

        if (status === 'DELIVERED') {
          updates.paymentProcessed = 1;
        }

        dbHelpers.updateOrder(orderId, updates);

        const updated = dbHelpers.getOrderById(orderId);
        return {
          ...updated,
          orderItems: JSON.parse(updated.orderItems),
          statusHistory: JSON.parse(updated.statusHistory),
          isPickedUp: Boolean(updated.isPickedUp),
          paymentProcessed: Boolean(updated.paymentProcessed),
        };
      } catch (error) {
        console.error('Error updating order status by rider:', error);
        throw new Error('Failed to update order status: ' + error.message);
      }
    },
  },
};

/**
 * Upload a file to imgbb image hosting service
 * @param {Upload} file - The file to upload (GraphQL Upload type)
 * @param {string} folder - Optional folder name for organization (used in image name)
 * @returns {Promise<string>} The public URL of the uploaded file
 */
async function uploadFileToStorage(file, folder = 'images') {
  const IMGBB_API_KEY = '7423450f81b14c198b65e9d2ba033c5b';
  
  try {
    const { createReadStream, filename, mimetype } = await file;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(mimetype)) {
      throw new Error(`Invalid file type: ${mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Read file stream into buffer
    const stream = createReadStream();
    const chunks = [];
    
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', resolve);
    });
    
    const buffer = Buffer.concat(chunks);
    const base64Image = buffer.toString('base64');

    // Create form data for imgbb API
    const formData = new FormData();
    formData.append('image', base64Image);
    formData.append('name', `${folder}-${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`);

    // Upload to imgbb
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (response.data && response.data.data && response.data.data.url) {
      const imageUrl = response.data.data.url;
      console.log('✅ File uploaded successfully to imgbb:', imageUrl);
      return imageUrl;
    } else {
      throw new Error('Invalid response from imgbb API');
    }
  } catch (error) {
    console.error('Error uploading file to imgbb:', error.message);
    if (error.response) {
      console.error('imgbb API error:', error.response.data);
      throw new Error(`Failed to upload file: ${error.response.data.error?.message || error.message}`);
    }
    throw new Error('Failed to upload file: ' + error.message);
  }
}

/**
 * Get user profile by Firebase UID from SQLite
 * @param {string} uid - Firebase user ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(uid) {
  try {
    const user = dbHelpers.getUserByUid(uid);
    if (!user) return null;

    const addresses = dbHelpers.getAddressesByUserId(uid);

    return {
      id: uid,
      uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      addresses: addresses.map(addr => ({
        ...addr,
        isDefault: Boolean(addr.isDefault),
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

module.exports = { typeDefs, resolvers };