const { gql } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const { db, admin } = require('./firebase');

// PubSub instance for real-time subscriptions
const pubsub = new PubSub();

// Subscription event constants
const ORDER_STATUS_UPDATED = 'ORDER_STATUS_UPDATED';

// Optional secondary Firebase (e.g., MenuVerse project)
let dbSecondary = null;
try {
  const adminLib = require('firebase-admin');
  const hasSecondary = process.env.SECONDARY_FIREBASE_PROJECT_ID &&
    process.env.SECONDARY_FIREBASE_PRIVATE_KEY &&
    process.env.SECONDARY_FIREBASE_CLIENT_EMAIL;
  if (hasSecondary) {
    const existing = adminLib.apps.find(a => a.name === 'secondary');
    const secondaryCredential = {
      type: 'service_account',
      project_id: process.env.SECONDARY_FIREBASE_PROJECT_ID,
      private_key_id: process.env.SECONDARY_FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.SECONDARY_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.SECONDARY_FIREBASE_CLIENT_EMAIL,
      client_id: process.env.SECONDARY_FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.SECONDARY_FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: 'googleapis.com',
    };
    const secondaryApp = existing || adminLib.initializeApp({ credential: adminLib.credential.cert(secondaryCredential) }, 'secondary');
    dbSecondary = adminLib.firestore(secondaryApp);
  }
} catch (e) {
  // no-op: secondary optional
}

const typeDefs = gql`
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
    deliveryCharges: Float
    tipping: Float
    taxationAmount: Float
    address: String
    instructions: String
    couponCode: String
    statusHistory: [StatusUpdate!]!
    riderInfo: RiderInfo
    menuVerseVendorId: String
    menuVerseOrderId: String
    lastSyncedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type RiderInfo {
    name: String
    phone: String
    vehicle: String
    plateNumber: String
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
      menuVerseVendorId: String
    ): Order!
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
    syncOrderFromMenuVerse(
      orderId: ID!
      vendorId: String
    ): Order!
    syncAllOrdersFromMenuVerse(
      userId: ID
      limit: Int
    ): [Order!]!
    webhookMenuVerseOrderUpdate(
      orderId: ID!
      status: String!
      restaurantId: String
      restaurantName: String
      riderInfo: RiderInfoInput
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
  }

  input OpeningHourInput {
    day: String!
    open: String!
    close: String!
    isClosed: Boolean!
  }

  input RiderInfoInput {
    name: String
    phone: String
    vehicle: String
    plateNumber: String
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

  type Subscription {
    orderStatusUpdated(orderId: ID!): Order!
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      return getUserById(user.uid);
    },
    orders: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');

      const email = user.email || null;
      const phone = user.phone_number || null;

      // Primary source: canonical orders collection by userId
      const primarySnap = await db.collection('orders').where('userId', '==', user.uid).get();
      let results = primarySnap.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt || data.orderDate || new Date().toISOString();
        // Normalize orderItems in case some docs have `items`
        const orderItems = Array.isArray(data.orderItems)
          ? data.orderItems
          : Array.isArray(data.items)
            ? data.items.map((it, idx) => ({
                id: it.id || String(idx + 1),
                title: it.title || it.name || 'Item',
                description: it.description || '',
                quantity: it.quantity || 1,
                price: it.price || it.unitPrice || 0,
                total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)),
              }))
            : [];
        return {
          id: doc.id,
          ...data,
          orderItems,
          statusHistory: data.statusHistory || [],
          createdAt,
          updatedAt: data.updatedAt || createdAt,
        };
      });

      // Union: primary customer-orders by customerId
      try {
        const coSnap = await db.collection('customer-orders').where('customerId', '==', user.uid).get();
        const mapped = coSnap.docs.map(doc => {
          const d = doc.data();
          const createdAt = d.createdAt || d.orderDate || new Date().toISOString();
          const orderItems = Array.isArray(d.orderItems)
            ? d.orderItems
            : Array.isArray(d.items)
              ? d.items.map((it, idx) => ({ id: it.id || String(idx + 1), title: it.title || it.name || 'Item', description: it.description || '', quantity: it.quantity || 1, price: it.price || it.unitPrice || 0, total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)) }))
              : [];
          const paidAmount = typeof d.paidAmount === 'number' ? d.paidAmount : (typeof d.totalAmount === 'number' ? d.totalAmount : 0);
          return {
            id: doc.id,
            orderId: d.orderId || doc.id,
            userId: user.uid,
            restaurant: d.restaurantName || d.restaurant || d.vendorName || 'Restaurant',
            orderItems,
            orderAmount: typeof d.orderAmount === 'number' ? d.orderAmount : paidAmount,
            paidAmount,
            paymentMethod: d.paymentMethod || 'CASH',
            orderStatus: d.orderStatus || d.status || 'CONFIRMED',
            orderDate: d.orderDate || createdAt,
            expectedTime: d.expectedTime || null,
            isPickedUp: d.isPickedUp || false,
            deliveryCharges: d.deliveryCharges || 0,
            tipping: d.tipping || 0,
            taxationAmount: d.taxationAmount || 0,
            address: d.address || d.deliveryAddress || null,
            instructions: d.instructions || null,
            couponCode: d.couponCode || null,
            statusHistory: Array.isArray(d.statusHistory) ? d.statusHistory : [{ status: d.orderStatus || d.status || 'CONFIRMED', timestamp: createdAt }],
            createdAt,
            updatedAt: d.updatedAt || createdAt,
          };
        });
        results = results.concat(mapped);
      } catch (e) {
        // ignore if collection not found
      }

      // Union: secondary project's customer-orders (MenuVerse)
      if (dbSecondary) {
        try {
          const coSnap2 = await dbSecondary.collection('customer-orders').where('customerId', '==', user.uid).get();
          const mapped2 = coSnap2.docs.map(doc => {
            const d = doc.data();
            const createdAt = d.createdAt || d.orderDate || new Date().toISOString();
            const orderItems = Array.isArray(d.orderItems)
              ? d.orderItems
              : Array.isArray(d.items)
                ? d.items.map((it, idx) => ({ id: it.id || String(idx + 1), title: it.title || it.name || 'Item', description: it.description || '', quantity: it.quantity || 1, price: it.price || it.unitPrice || 0, total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)) }))
                : [];
            const paidAmount = typeof d.paidAmount === 'number' ? d.paidAmount : (typeof d.totalAmount === 'number' ? d.totalAmount : 0);
            return {
              id: doc.id,
              orderId: d.orderId || doc.id,
              userId: user.uid,
              restaurant: d.restaurantName || d.restaurant || d.vendorName || 'Restaurant',
              orderItems,
              orderAmount: typeof d.orderAmount === 'number' ? d.orderAmount : paidAmount,
              paidAmount,
              paymentMethod: d.paymentMethod || 'CASH',
              orderStatus: d.orderStatus || d.status || 'CONFIRMED',
              orderDate: d.orderDate || createdAt,
              expectedTime: d.expectedTime || null,
              isPickedUp: d.isPickedUp || false,
              deliveryCharges: d.deliveryCharges || 0,
              tipping: d.tipping || 0,
              taxationAmount: d.taxationAmount || 0,
              address: d.address || d.deliveryAddress || null,
              instructions: d.instructions || null,
              couponCode: d.couponCode || null,
              statusHistory: Array.isArray(d.statusHistory) ? d.statusHistory : [{ status: d.orderStatus || d.status || 'CONFIRMED', timestamp: createdAt }],
              createdAt,
              updatedAt: d.updatedAt || createdAt,
            };
          });
          results = results.concat(mapped2);
        } catch (e) {
          // ignore if secondary not accessible
        }
      }

      // Fallback A: match by customer email (in primary project)
      if (results.length === 0 && email) {
        try {
          const emailSnap = await db.collection('orders').where('customer.email', '==', email).get();
          const mapped = emailSnap.docs.map(doc => {
            const d = doc.data();
            const createdAt = d.createdAt || d.orderDate || new Date().toISOString();
            const orderItems = Array.isArray(d.orderItems)
              ? d.orderItems
              : Array.isArray(d.items)
                ? d.items.map((it, idx) => ({
                    id: it.id || String(idx + 1),
                    title: it.title || it.name || 'Item',
                    description: it.description || '',
                    quantity: it.quantity || 1,
                    price: it.price || it.unitPrice || 0,
                    total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)),
                  }))
                : [];
            const paidAmount = typeof d.paidAmount === 'number' ? d.paidAmount : (typeof d.totalAmount === 'number' ? d.totalAmount : 0);
            return {
              id: doc.id,
              orderId: d.orderId || doc.id,
              userId: d.userId || user.uid,
              restaurant: d.restaurant || d.restaurantName || 'Restaurant',
              orderItems,
              orderAmount: typeof d.orderAmount === 'number' ? d.orderAmount : paidAmount,
              paidAmount,
              paymentMethod: d.paymentMethod || 'CASH',
              orderStatus: d.orderStatus || d.status || 'CONFIRMED',
              orderDate: d.orderDate || createdAt,
              expectedTime: d.expectedTime || null,
              isPickedUp: d.isPickedUp || false,
              deliveryCharges: d.deliveryCharges || 0,
              tipping: d.tipping || 0,
              taxationAmount: d.taxationAmount || 0,
              address: d.address || d.deliveryAddress || null,
              instructions: d.instructions || null,
              couponCode: d.couponCode || null,
              statusHistory: Array.isArray(d.statusHistory) ? d.statusHistory : [{ status: d.orderStatus || d.status || 'CONFIRMED', timestamp: createdAt }],
              createdAt,
              updatedAt: d.updatedAt || createdAt,
            };
          });
          results = mapped;
        } catch (e) {
          console.warn('Email fallback failed:', e?.message || e);
        }
      }

      // Fallback B: match by customer phone (in primary project)
      if (results.length === 0 && phone) {
        try {
          const phoneSnap = await db.collection('orders').where('customer.phone', '==', phone).get();
          const mapped = phoneSnap.docs.map(doc => {
            const d = doc.data();
            const createdAt = d.createdAt || d.orderDate || new Date().toISOString();
            const orderItems = Array.isArray(d.orderItems)
              ? d.orderItems
              : Array.isArray(d.items)
                ? d.items.map((it, idx) => ({
                    id: it.id || String(idx + 1),
                    title: it.title || it.name || 'Item',
                    description: it.description || '',
                    quantity: it.quantity || 1,
                    price: it.price || it.unitPrice || 0,
                    total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)),
                  }))
                : [];
            const paidAmount = typeof d.paidAmount === 'number' ? d.paidAmount : (typeof d.totalAmount === 'number' ? d.totalAmount : 0);
            return {
              id: doc.id,
              orderId: d.orderId || doc.id,
              userId: d.userId || user.uid,
              restaurant: d.restaurant || d.restaurantName || 'Restaurant',
              orderItems,
              orderAmount: typeof d.orderAmount === 'number' ? d.orderAmount : paidAmount,
              paidAmount,
              paymentMethod: d.paymentMethod || 'CASH',
              orderStatus: d.orderStatus || d.status || 'CONFIRMED',
              orderDate: d.orderDate || createdAt,
              expectedTime: d.expectedTime || null,
              isPickedUp: d.isPickedUp || false,
              deliveryCharges: d.deliveryCharges || 0,
              tipping: d.tipping || 0,
              taxationAmount: d.taxationAmount || 0,
              address: d.address || d.deliveryAddress || null,
              instructions: d.instructions || null,
              couponCode: d.couponCode || null,
              statusHistory: Array.isArray(d.statusHistory) ? d.statusHistory : [{ status: d.orderStatus || d.status || 'CONFIRMED', timestamp: createdAt }],
              createdAt,
              updatedAt: d.updatedAt || createdAt,
            };
          });
          results = mapped;
        } catch (e) {
          console.warn('Phone fallback failed:', e?.message || e);
        }
      }

      // Fallback: legacy/customer-orders collection (best-effort mapping)
      if (results.length === 0) {
        try {
          const legacySnap = await db.collection('customer-orders').where('customerId', '==', user.uid).get();
          results = legacySnap.docs.map(doc => {
            const d = doc.data();
            // Map legacy fields to current schema
            const orderStatus = d.orderStatus || d.status || 'CONFIRMED';
            const paidAmount = typeof d.paidAmount === 'number' ? d.paidAmount : (typeof d.totalAmount === 'number' ? d.totalAmount : 0);
            const createdAt = d.createdAt || d.orderDate || new Date().toISOString();
            const orderItems = Array.isArray(d.orderItems)
              ? d.orderItems
              : Array.isArray(d.items)
                ? d.items.map((it, idx) => ({
                    id: it.id || String(idx + 1),
                    title: it.title || it.name || 'Item',
                    description: it.description || '',
                    quantity: it.quantity || 1,
                    price: it.price || it.unitPrice || 0,
                    total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)),
                  }))
                : [];

            return {
              id: doc.id,
              orderId: d.orderId || doc.id,
              userId: user.uid,
              restaurant: d.restaurantName || d.restaurant || d.vendorName || 'Restaurant',
              orderItems,
              orderAmount: typeof d.orderAmount === 'number' ? d.orderAmount : paidAmount,
              paidAmount,
              paymentMethod: d.paymentMethod || 'CASH',
              orderStatus,
              orderDate: d.orderDate || createdAt,
              expectedTime: d.expectedTime || null,
              isPickedUp: d.isPickedUp || false,
              deliveryCharges: d.deliveryCharges || 0,
              tipping: d.tipping || 0,
              taxationAmount: d.taxationAmount || 0,
              address: d.address || d.deliveryAddress || null,
              instructions: d.instructions || null,
              couponCode: d.couponCode || null,
              statusHistory: Array.isArray(d.statusHistory) ? d.statusHistory : [{ status: orderStatus, timestamp: createdAt }],
              createdAt,
              updatedAt: d.updatedAt || createdAt,
            };
          });
        } catch (e) {
          console.warn('Legacy customer-orders fallback failed:', e?.message || e);
        }
      }

      // Deduplicate by (orderId,id) and sort desc by createdAt
      const seen = new Set();
      const unique = results.filter(r => {
        const key = `${r.orderId || ''}#${r.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      unique.sort((a, b) => (new Date(b.createdAt).getTime()) - (new Date(a.createdAt).getTime()));
      return unique;
    },
    order: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');
      const orderDoc = await db.collection('orders').doc(id).get();
      if (orderDoc.exists) {
        const data = orderDoc.data();
        const email = user.email || null;
        const phone = user.phone_number || null;
        const ownerMatch = data.userId === user.uid || (email && data?.customer?.email === email) || (phone && data?.customer?.phone === phone);
        if (!ownerMatch) throw new Error('Access denied');
        const createdAt = data.createdAt || data.orderDate || new Date().toISOString();
        const orderItems = Array.isArray(data.orderItems)
          ? data.orderItems
          : Array.isArray(data.items)
            ? data.items.map((it, idx) => ({
                id: it.id || String(idx + 1),
                title: it.title || it.name || 'Item',
                description: it.description || '',
                quantity: it.quantity || 1,
                price: it.price || it.unitPrice || 0,
                total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)),
              }))
            : [];
        const paidAmount = typeof data.paidAmount === 'number' ? data.paidAmount : (typeof data.totalAmount === 'number' ? data.totalAmount : 0);
        return {
          id: orderDoc.id,
          orderId: data.orderId || orderDoc.id,
          userId: data.userId || user.uid,
          restaurant: data.restaurant || data.restaurantName || 'Restaurant',
          orderItems,
          orderAmount: typeof data.orderAmount === 'number' ? data.orderAmount : paidAmount,
          paidAmount,
          paymentMethod: data.paymentMethod || 'CASH',
          orderStatus: data.orderStatus || data.status || 'CONFIRMED',
          orderDate: data.orderDate || createdAt,
          expectedTime: data.expectedTime || null,
          isPickedUp: data.isPickedUp || false,
          deliveryCharges: data.deliveryCharges || 0,
          tipping: data.tipping || 0,
          taxationAmount: data.taxationAmount || 0,
          address: data.address || data.deliveryAddress || null,
          instructions: data.instructions || null,
          couponCode: data.couponCode || null,
          statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [{ status: data.orderStatus || data.status || 'CONFIRMED', timestamp: createdAt }],
          createdAt,
          updatedAt: data.updatedAt || createdAt,
        };
      }

  // Fallback: legacy collection lookup (primary project)
  const legacyDoc = await db.collection('customer-orders').doc(id).get();
      if (!legacyDoc.exists) return null;
      const d = legacyDoc.data();
      if (d.customerId && d.customerId !== user.uid) throw new Error('Access denied');

      const orderStatus = d.orderStatus || d.status || 'CONFIRMED';
      const paidAmount = typeof d.paidAmount === 'number' ? d.paidAmount : (typeof d.totalAmount === 'number' ? d.totalAmount : 0);
      const createdAt = d.createdAt || d.orderDate || new Date().toISOString();
      const orderItems = Array.isArray(d.orderItems)
        ? d.orderItems
        : Array.isArray(d.items)
          ? d.items.map((it, idx) => ({
              id: it.id || String(idx + 1),
              title: it.title || it.name || 'Item',
              description: it.description || '',
              quantity: it.quantity || 1,
              price: it.price || it.unitPrice || 0,
              total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)),
            }))
          : [];

      return {
        id: legacyDoc.id,
        orderId: d.orderId || legacyDoc.id,
        userId: user.uid,
        restaurant: d.restaurantName || d.restaurant || d.vendorName || 'Restaurant',
        orderItems,
        orderAmount: typeof d.orderAmount === 'number' ? d.orderAmount : paidAmount,
        paidAmount,
        paymentMethod: d.paymentMethod || 'CASH',
        orderStatus,
        orderDate: d.orderDate || createdAt,
        expectedTime: d.expectedTime || null,
        isPickedUp: d.isPickedUp || false,
        deliveryCharges: d.deliveryCharges || 0,
        tipping: d.tipping || 0,
        taxationAmount: d.taxationAmount || 0,
        address: d.address || d.deliveryAddress || null,
        instructions: d.instructions || null,
        couponCode: d.couponCode || null,
        statusHistory: Array.isArray(d.statusHistory) ? d.statusHistory : [{ status: orderStatus, timestamp: createdAt }],
        createdAt,
        updatedAt: d.updatedAt || createdAt,
      };
    
      // Secondary project lookup by id
      if (dbSecondary) {
        const legacyDoc2 = await dbSecondary.collection('customer-orders').doc(id).get();
        if (legacyDoc2.exists) {
          const d2 = legacyDoc2.data();
          if (d2.customerId && d2.customerId !== user.uid) throw new Error('Access denied');
          const status2 = d2.orderStatus || d2.status || 'CONFIRMED';
          const paid2 = typeof d2.paidAmount === 'number' ? d2.paidAmount : (typeof d2.totalAmount === 'number' ? d2.totalAmount : 0);
          const created2 = d2.createdAt || d2.orderDate || new Date().toISOString();
          const orderItems2 = Array.isArray(d2.orderItems)
            ? d2.orderItems
            : Array.isArray(d2.items)
              ? d2.items.map((it, idx) => ({ id: it.id || String(idx + 1), title: it.title || it.name || 'Item', description: it.description || '', quantity: it.quantity || 1, price: it.price || it.unitPrice || 0, total: it.total || ((it.price || it.unitPrice || 0) * (it.quantity || 1)) }))
              : [];
          return {
            id: legacyDoc2.id,
            orderId: d2.orderId || legacyDoc2.id,
            userId: user.uid,
            restaurant: d2.restaurantName || d2.restaurant || d2.vendorName || 'Restaurant',
            orderItems: orderItems2,
            orderAmount: typeof d2.orderAmount === 'number' ? d2.orderAmount : paid2,
            paidAmount: paid2,
            paymentMethod: d2.paymentMethod || 'CASH',
            orderStatus: status2,
            orderDate: d2.orderDate || created2,
            expectedTime: d2.expectedTime || null,
            isPickedUp: d2.isPickedUp || false,
            deliveryCharges: d2.deliveryCharges || 0,
            tipping: d2.tipping || 0,
            taxationAmount: d2.taxationAmount || 0,
            address: d2.address || d2.deliveryAddress || null,
            instructions: d2.instructions || null,
            couponCode: d2.couponCode || null,
            statusHistory: Array.isArray(d2.statusHistory) ? d2.statusHistory : [{ status: status2, timestamp: created2 }],
            createdAt: created2,
            updatedAt: d2.updatedAt || created2,
          };
        }
      }
    },
    addresses: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      const addressesSnapshot = await db.collection('addresses').where('userId', '==', user.uid).get();
      return addressesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
    address: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');
      const addressDoc = await db.collection('addresses').doc(id).get();
      if (!addressDoc.exists) return null;

      const data = addressDoc.data();
      if (data.userId !== user.uid) throw new Error('Access denied');

      return {
        id: addressDoc.id,
        ...data,
      };
    },
    restaurants: async (_, { search, cuisine, limit = 20, offset = 0 }) => {
      try {
        let query = db.collection('eateries');

        // Apply search filter
        if (search) {
          // Note: Firestore doesn't support full-text search natively
          // This is a simple implementation - in production you'd use Algolia or similar
          query = query.where('name', '>=', search).where('name', '<=', search + '\uf8ff');
        }

        // Apply cuisine filter
        if (cuisine) {
          query = query.where('cuisine', 'array-contains', cuisine);
        }

        const snapshot = await query.limit(limit).offset(offset).get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          cuisine: doc.data().cuisine || [],
          openingHours: doc.data().openingHours || [],
          isActive: doc.data().isActive !== false,
          rating: doc.data().rating || null,
          reviewCount: doc.data().reviewCount || 0,
        }));
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw new Error('Failed to fetch restaurants');
      }
    },
    restaurant: async (_, { id }) => {
      try {
        const doc = await db.collection('eateries').doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          cuisine: data.cuisine || [],
          openingHours: data.openingHours || [],
          isActive: data.isActive !== false,
          rating: data.rating || null,
          reviewCount: data.reviewCount || 0,
        };
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        throw new Error('Failed to fetch restaurant');
      }
    },
    menuItems: async (_, { restaurantId }) => {
      try {
        const snapshot = await db.collection('eateries').doc(restaurantId).collection('menu_items').get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          restaurantId,
          ...doc.data(),
          isAvailable: doc.data().isAvailable !== false,
          isVegetarian: doc.data().isVegetarian || false,
          isVegan: doc.data().isVegan || false,
          allergens: doc.data().allergens || [],
        }));
      } catch (error) {
        console.error('Error fetching menu items:', error);
        throw new Error('Failed to fetch menu items');
      }
    },
    menuItem: async (_, { id }) => {
      try {
        // This is a simplified implementation - in production you'd need to find the restaurant first
        // For now, we'll search across all restaurants (not efficient)
        const eateriesSnapshot = await db.collection('eateries').get();
        for (const eateryDoc of eateriesSnapshot.docs) {
          const menuItemDoc = await eateryDoc.ref.collection('menu_items').doc(id).get();
          if (menuItemDoc.exists) {
            const data = menuItemDoc.data();
            return {
              id: menuItemDoc.id,
              restaurantId: eateryDoc.id,
              ...data,
              isAvailable: data.isAvailable !== false,
              isVegetarian: data.isVegetarian || false,
              isVegan: data.isVegan || false,
              allergens: data.allergens || [],
            };
          }
        }
        return null;
      } catch (error) {
        console.error('Error fetching menu item:', error);
        throw new Error('Failed to fetch menu item');
      }
    },
    menuCategories: async (_, { restaurantId }) => {
      try {
        const snapshot = await db.collection('eateries').doc(restaurantId).collection('menu_categories').get();
        return snapshot.docs.map(doc => ({
          id: doc.id,
          restaurantId,
          ...doc.data(),
          displayOrder: doc.data().displayOrder || 0,
        }));
      } catch (error) {
        console.error('Error fetching menu categories:', error);
        throw new Error('Failed to fetch menu categories');
      }
    },
  },
  Mutation: {
    signUp: async (_, { email, password, displayName, phoneNumber }) => {
      try {
        const userData = {
          email,
          password,
          displayName,
        };

        // Only add phoneNumber if provided
        if (phoneNumber) {
          userData.phoneNumber = phoneNumber;
        }

        const userRecord = await admin.auth().createUser(userData);

        // Create user profile in Firestore
        const profileData = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || null,
          phoneNumber: userRecord.phoneNumber || null,
          photoURL: userRecord.photoURL || null,
          addresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.collection('users').doc(userRecord.uid).set(profileData);

        // Generate custom token
        const token = await admin.auth().createCustomToken(userRecord.uid);

        return {
          user: {
            id: userRecord.uid,
            ...profileData,
          },
          token,
        };
      } catch (error) {
        console.error('Error signing up:', error);
        throw new Error('Failed to sign up: ' + error.message);
      }
    },
    signIn: async (_, { email, password }) => {
      try {
        // Firebase Admin SDK doesn't support password sign-in directly
        // In production, you'd use Firebase Auth REST API or client-side auth
        // For now, we'll create a custom token for the user
        const userRecord = await admin.auth().getUserByEmail(email);
        const token = await admin.auth().createCustomToken(userRecord.uid);

        const user = await getUserById(userRecord.uid);

        return {
          user,
          token,
        };
      } catch (error) {
        console.error('Error signing in:', error);
        throw new Error('Failed to sign in: ' + error.message);
      }
    },
    signInWithGoogle: async (_, { idToken }) => {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Ensure user profile exists
        let user = await getUserById(uid);
        if (!user) {
          const userRecord = await admin.auth().getUser(uid);
          const userData = {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || null,
            phoneNumber: userRecord.phoneNumber || null,
            photoURL: userRecord.photoURL || null,
            addresses: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.collection('users').doc(uid).set(userData);
          user = {
            id: uid,
            ...userData,
          };
        }

        const token = await admin.auth().createCustomToken(uid);

        return {
          user,
          token,
        };
      } catch (error) {
        console.error('Error signing in with Google:', error);
        throw new Error('Failed to sign in with Google: ' + error.message);
      }
    },
    signInWithPhone: async (_, { phoneNumber, verificationId, code }) => {
      try {
        // This is a simplified implementation
        // In production, you'd verify the code with Firebase Auth
        const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
        const token = await admin.auth().createCustomToken(userRecord.uid);

        const user = await getUserById(userRecord.uid);

        return {
          user,
          token,
        };
      } catch (error) {
        console.error('Error signing in with phone:', error);
        throw new Error('Failed to sign in with phone: ' + error.message);
      }
    },
    updateProfile: async (_, { displayName, phoneNumber, photoURL }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (photoURL !== undefined) updateData.photoURL = photoURL;
        updateData.updatedAt = new Date().toISOString();

        await db.collection('users').doc(user.uid).update(updateData);

        // Update Firebase Auth profile
        await admin.auth().updateUser(user.uid, {
          displayName,
          phoneNumber,
          photoURL,
        });

        return await getUserById(user.uid);
      } catch (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile: ' + error.message);
      }
    },
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

        // If this is the default address, unset other defaults
        if (isDefault) {
          const addressesSnapshot = await db.collection('addresses')
            .where('userId', '==', user.uid)
            .where('isDefault', '==', true)
            .get();

          const batch = db.batch();
          addressesSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isDefault: false, updatedAt: new Date().toISOString() });
          });
          await batch.commit();
        }

        const docRef = await db.collection('addresses').add(addressData);

        return {
          id: docRef.id,
          ...addressData,
        };
      } catch (error) {
        console.error('Error adding address:', error);
        throw new Error('Failed to add address: ' + error.message);
      }
    },
    updateAddress: async (_, { id, label, street, city, state, zipCode, country, isDefault }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const addressRef = db.collection('addresses').doc(id);
        const addressDoc = await addressRef.get();

        if (!addressDoc.exists) throw new Error('Address not found');

        const addressData = addressDoc.data();
        if (addressData.userId !== user.uid) throw new Error('Access denied');

        const updateData = { updatedAt: new Date().toISOString() };
        if (label !== undefined) updateData.label = label;
        if (street !== undefined) updateData.street = street;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (zipCode !== undefined) updateData.zipCode = zipCode;
        if (country !== undefined) updateData.country = country;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        // If setting as default, unset other defaults
        if (isDefault) {
          const addressesSnapshot = await db.collection('addresses')
            .where('userId', '==', user.uid)
            .where('isDefault', '==', true)
            .get();

          const batch = db.batch();
          addressesSnapshot.docs.forEach(doc => {
            if (doc.id !== id) {
              batch.update(doc.ref, { isDefault: false, updatedAt: new Date().toISOString() });
            }
          });
          await batch.commit();
        }

        await addressRef.update(updateData);

        const updatedDoc = await addressRef.get();
        return {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        };
      } catch (error) {
        console.error('Error updating address:', error);
        throw new Error('Failed to update address: ' + error.message);
      }
    },
    deleteAddress: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const addressRef = db.collection('addresses').doc(id);
        const addressDoc = await addressRef.get();

        if (!addressDoc.exists) throw new Error('Address not found');

        const addressData = addressDoc.data();
        if (addressData.userId !== user.uid) throw new Error('Access denied');

        await addressRef.delete();
        return true;
      } catch (error) {
        console.error('Error deleting address:', error);
        throw new Error('Failed to delete address: ' + error.message);
      }
    },
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
      instructions,
      menuVerseVendorId
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
          menuVerseVendorId: menuVerseVendorId || null,
          menuVerseOrderId: menuVerseVendorId ? orderId : null,
          lastSyncedAt: null,
          statusHistory: [{
            status: orderStatus,
            timestamp: new Date().toISOString(),
            note: `Order placed with ${paymentMethod} payment${menuVerseVendorId ? ' (MenuVerse)' : ''}`
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to Firebase
        console.log('Attempting to save order to Firebase...');
        const docRef = await db.collection('orders').add(orderData);
        console.log('Order saved successfully with ID:', docRef.id);

        // If MenuVerse vendor ID provided, also save to MenuVerse database
        if (menuVerseVendorId && dbSecondary) {
          try {
            console.log(`💾 Saving order to MenuVerse: eateries/${menuVerseVendorId}/orders/${docRef.id}`);
            await dbSecondary.collection('eateries').doc(menuVerseVendorId).collection('orders').doc(docRef.id).set({
              ...orderData,
              platform: 'ChopChop',
              chopChopOrderId: docRef.id,
              status: orderStatus,
              totalAmount: paidAmount,
            });
            console.log('✅ Order also saved to MenuVerse database');
          } catch (menuVerseError) {
            console.error('⚠️  Failed to save to MenuVerse (non-critical):', menuVerseError.message);
            // Don't fail the entire order placement if MenuVerse save fails
          }
        }

        return {
          id: docRef.id,
          ...orderData,
        };
      } catch (error) {
        console.error('Error placing order:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw new Error('Failed to place order: ' + error.message);
      }
    },
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
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
          throw new Error('Order not found');
        }

        const currentOrder = orderDoc.data();

        // Check if order belongs to user (or if user is admin - for now, only allow order owner)
        if (currentOrder.userId !== user.uid) {
          throw new Error('Access denied: Can only update your own orders');
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

        const updatedStatusHistory = [...(currentOrder.statusHistory || []), statusUpdate];

        await orderRef.update({
          orderStatus: status,
          statusHistory: updatedStatusHistory,
          updatedAt: new Date().toISOString(),
        });

        console.log(`Order ${orderId} status updated: ${currentStatus} → ${status}`);

        // Return updated order
        const updatedDoc = await orderRef.get();
        const updatedOrder = {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        };

        // Publish real-time update to subscriptions
        pubsub.publish(ORDER_STATUS_UPDATED, {
          orderStatusUpdated: updatedOrder,
        });

        console.log(`✅ Published order status update for order ${orderId}`);

        return updatedOrder;
      } catch (error) {
        console.error('Error updating order status:', error);
        throw new Error('Failed to update order status: ' + error.message);
      }
    },
    syncOrderFromMenuVerse: async (_, { orderId, vendorId }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        console.log(`🔄 Syncing order ${orderId} from MenuVerse for user ${user.uid}`);

        // Check if secondary Firebase (MenuVerse) is configured
        if (!dbSecondary) {
          throw new Error('MenuVerse integration not configured. Set SECONDARY_FIREBASE_* environment variables.');
        }

        // Find the order in ChopChop first to verify user owns it
        const chopChopOrderRef = db.collection('orders').doc(orderId);
        const chopChopOrderDoc = await chopChopOrderRef.get();

        if (!chopChopOrderDoc.exists) {
          throw new Error('Order not found in ChopChop database');
        }

        const chopChopOrder = chopChopOrderDoc.data();
        
        // Verify user owns this order
        if (chopChopOrder.userId !== user.uid) {
          throw new Error('Access denied: Can only sync your own orders');
        }

        // Get vendor ID from order if not provided
        const menuVerseVendorId = vendorId || chopChopOrder.menuVerseVendorId;
        
        if (!menuVerseVendorId) {
          throw new Error('Vendor ID required for MenuVerse sync');
        }

        // Fetch order from MenuVerse
        console.log(`📡 Fetching from MenuVerse: eateries/${menuVerseVendorId}/orders/${orderId}`);
        const menuVerseOrderRef = dbSecondary.collection('eateries').doc(menuVerseVendorId).collection('orders').doc(orderId);
        const menuVerseOrderDoc = await menuVerseOrderRef.get();

        if (!menuVerseOrderDoc.exists) {
          throw new Error('Order not found in MenuVerse database');
        }

        const menuVerseOrder = menuVerseOrderDoc.data();
        console.log(`✅ Found MenuVerse order with status: ${menuVerseOrder.status}`);

        // Map MenuVerse status to ChopChop status
        const statusMap = {
          'PENDING': 'PENDING_PAYMENT',
          'PENDING_PAYMENT': 'PENDING_PAYMENT',
          'CONFIRMED': 'CONFIRMED',
          'PROCESSING': 'PROCESSING',
          'READY': 'READY',
          'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
          'DELIVERED': 'DELIVERED',
          'CANCELLED': 'CANCELLED'
        };

        const newStatus = statusMap[menuVerseOrder.status] || menuVerseOrder.status;

        // Only update if status has changed
        if (chopChopOrder.orderStatus !== newStatus) {
          const statusUpdate = {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: `Synced from MenuVerse: ${menuVerseOrder.status}`
          };

          const updatedStatusHistory = [...(chopChopOrder.statusHistory || []), statusUpdate];

          const updateData = {
            orderStatus: newStatus,
            statusHistory: updatedStatusHistory,
            lastSyncedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Add rider info if available
          if (menuVerseOrder.riderInfo) {
            updateData.riderInfo = {
              name: menuVerseOrder.riderInfo.name || null,
              phone: menuVerseOrder.riderInfo.phone || null,
              vehicle: menuVerseOrder.riderInfo.vehicle || null,
              plateNumber: menuVerseOrder.riderInfo.plateNumber || null,
            };
          }

          await chopChopOrderRef.update(updateData);
          console.log(`✅ Updated ChopChop order ${orderId}: ${chopChopOrder.orderStatus} → ${newStatus}`);

          // Publish real-time update
          const updatedDoc = await chopChopOrderRef.get();
          const updatedOrder = {
            id: updatedDoc.id,
            ...updatedDoc.data(),
          };

          pubsub.publish(ORDER_STATUS_UPDATED, {
            orderStatusUpdated: updatedOrder,
          });

          return updatedOrder;
        } else {
          console.log(`ℹ️  Order ${orderId} already up to date (${newStatus})`);
          
          // Update lastSyncedAt even if no status change
          await chopChopOrderRef.update({
            lastSyncedAt: new Date().toISOString(),
          });

          const updatedDoc = await chopChopOrderRef.get();
          return {
            id: updatedDoc.id,
            ...updatedDoc.data(),
          };
        }
      } catch (error) {
        console.error('Error syncing order from MenuVerse:', error);
        throw new Error('Failed to sync order from MenuVerse: ' + error.message);
      }
    },
    syncAllOrdersFromMenuVerse: async (_, { userId, limit }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const targetUserId = userId || user.uid;
        
        // Verify user can sync these orders
        if (targetUserId !== user.uid) {
          throw new Error('Access denied: Can only sync your own orders');
        }

        console.log(`🔄 Syncing all orders for user ${targetUserId}`);

        if (!dbSecondary) {
          throw new Error('MenuVerse integration not configured');
        }

        // Get all user's orders from ChopChop that have MenuVerse vendor IDs
        const ordersQuery = db.collection('orders')
          .where('userId', '==', targetUserId)
          .where('menuVerseVendorId', '!=', null)
          .orderBy('menuVerseVendorId')
          .orderBy('createdAt', 'desc');

        const ordersSnapshot = await (limit ? ordersQuery.limit(limit) : ordersQuery).get();
        
        console.log(`📦 Found ${ordersSnapshot.size} orders to sync`);

        const syncedOrders = [];

        for (const orderDoc of ordersSnapshot.docs) {
          try {
            const chopChopOrder = orderDoc.data();
            const orderId = orderDoc.id;
            const vendorId = chopChopOrder.menuVerseVendorId;

            // Fetch from MenuVerse
            const menuVerseOrderRef = dbSecondary.collection('eateries').doc(vendorId).collection('orders').doc(orderId);
            const menuVerseOrderDoc = await menuVerseOrderRef.get();

            if (menuVerseOrderDoc.exists) {
              const menuVerseOrder = menuVerseOrderDoc.data();
              
              const statusMap = {
                'PENDING': 'PENDING_PAYMENT',
                'PENDING_PAYMENT': 'PENDING_PAYMENT',
                'CONFIRMED': 'CONFIRMED',
                'PROCESSING': 'PROCESSING',
                'READY': 'READY',
                'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
                'DELIVERED': 'DELIVERED',
                'CANCELLED': 'CANCELLED'
              };

              const newStatus = statusMap[menuVerseOrder.status] || menuVerseOrder.status;

              if (chopChopOrder.orderStatus !== newStatus) {
                const statusUpdate = {
                  status: newStatus,
                  timestamp: new Date().toISOString(),
                  note: `Bulk sync from MenuVerse: ${menuVerseOrder.status}`
                };

                const updatedStatusHistory = [...(chopChopOrder.statusHistory || []), statusUpdate];

                const updateData = {
                  orderStatus: newStatus,
                  statusHistory: updatedStatusHistory,
                  lastSyncedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                if (menuVerseOrder.riderInfo) {
                  updateData.riderInfo = {
                    name: menuVerseOrder.riderInfo.name || null,
                    phone: menuVerseOrder.riderInfo.phone || null,
                    vehicle: menuVerseOrder.riderInfo.vehicle || null,
                    plateNumber: menuVerseOrder.riderInfo.plateNumber || null,
                  };
                }

                await orderDoc.ref.update(updateData);
                console.log(`✅ Synced order ${orderId}: ${chopChopOrder.orderStatus} → ${newStatus}`);

                // Publish real-time update
                const updatedDoc = await orderDoc.ref.get();
                const updatedOrder = {
                  id: updatedDoc.id,
                  ...updatedDoc.data(),
                };

                pubsub.publish(ORDER_STATUS_UPDATED, {
                  orderStatusUpdated: updatedOrder,
                });

                syncedOrders.push(updatedOrder);
              } else {
                // No status change, just update sync time
                await orderDoc.ref.update({
                  lastSyncedAt: new Date().toISOString(),
                });

                syncedOrders.push({
                  id: orderDoc.id,
                  ...chopChopOrder,
                  lastSyncedAt: new Date().toISOString(),
                });
              }
            } else {
              console.log(`⚠️  Order ${orderId} not found in MenuVerse`);
              syncedOrders.push({
                id: orderDoc.id,
                ...chopChopOrder,
              });
            }
          } catch (syncError) {
            console.error(`Error syncing individual order ${orderDoc.id}:`, syncError);
            // Continue with other orders
            syncedOrders.push({
              id: orderDoc.id,
              ...orderDoc.data(),
            });
          }
        }

        console.log(`✅ Bulk sync complete: ${syncedOrders.length} orders processed`);
        return syncedOrders;
      } catch (error) {
        console.error('Error syncing all orders from MenuVerse:', error);
        throw new Error('Failed to sync orders from MenuVerse: ' + error.message);
      }
    },
    webhookMenuVerseOrderUpdate: async (_, { orderId, status, restaurantId, restaurantName, riderInfo }, { user }) => {
      // Webhook doesn't require user authentication, but should validate API key
      // This would be handled by middleware checking headers
      
      try {
        console.log(`🪝 Webhook received for order ${orderId} with status ${status}`);

        // Find the order in ChopChop
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
          console.log(`⚠️  Order ${orderId} not found in ChopChop database`);
          throw new Error('Order not found');
        }

        const currentOrder = orderDoc.data();

        // Map MenuVerse status to ChopChop status
        const statusMap = {
          'PENDING': 'PENDING_PAYMENT',
          'PENDING_PAYMENT': 'PENDING_PAYMENT',
          'CONFIRMED': 'CONFIRMED',
          'PROCESSING': 'PROCESSING',
          'READY': 'READY',
          'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
          'DELIVERED': 'DELIVERED',
          'CANCELLED': 'CANCELLED'
        };

        const newStatus = statusMap[status] || status;

        // Update order with new status
        const statusUpdate = {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: `Updated via MenuVerse webhook: ${status}`
        };

        const updatedStatusHistory = [...(currentOrder.statusHistory || []), statusUpdate];

        const updateData = {
          orderStatus: newStatus,
          statusHistory: updatedStatusHistory,
          lastSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add restaurant info if provided
        if (restaurantId) {
          updateData.menuVerseVendorId = restaurantId;
        }

        if (restaurantName && !currentOrder.restaurant) {
          updateData.restaurant = restaurantName;
        }

        // Add rider info if provided
        if (riderInfo) {
          updateData.riderInfo = {
            name: riderInfo.name || null,
            phone: riderInfo.phone || null,
            vehicle: riderInfo.vehicle || null,
            plateNumber: riderInfo.plateNumber || null,
          };
        }

        await orderRef.update(updateData);
        console.log(`✅ Webhook updated order ${orderId}: ${currentOrder.orderStatus} → ${newStatus}`);

        // Publish real-time update
        const updatedDoc = await orderRef.get();
        const updatedOrder = {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        };

        pubsub.publish(ORDER_STATUS_UPDATED, {
          orderStatusUpdated: updatedOrder,
        });

        return updatedOrder;
      } catch (error) {
        console.error('Error processing webhook:', error);
        throw new Error('Failed to process webhook: ' + error.message);
      }
    },
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
          ownerId: user.uid, // Track who owns this restaurant
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const docRef = await db.collection('eateries').add(restaurantData);

        return {
          id: docRef.id,
          ...restaurantData,
        };
      } catch (error) {
        console.error('Error creating restaurant:', error);
        throw new Error('Failed to create restaurant: ' + error.message);
      }
    },
    updateRestaurant: async (_, { id, name, description, contactEmail, phoneNumber, address, cuisine, priceRange, openingHours, isActive }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        const restaurantRef = db.collection('eateries').doc(id);
        const restaurantDoc = await restaurantRef.get();

        if (!restaurantDoc.exists) throw new Error('Restaurant not found');

        const restaurantData = restaurantDoc.data();
        if (restaurantData.ownerId !== user.uid) throw new Error('Access denied: Can only update your own restaurants');

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

        await restaurantRef.update(updateData);

        const updatedDoc = await restaurantRef.get();
        const updatedData = updatedDoc.data();

        return {
          id: updatedDoc.id,
          ...updatedData,
          cuisine: updatedData.cuisine || [],
          openingHours: updatedData.openingHours || [],
          isActive: updatedData.isActive !== false,
          rating: updatedData.rating || null,
          reviewCount: updatedData.reviewCount || 0,
        };
      } catch (error) {
        console.error('Error updating restaurant:', error);
        throw new Error('Failed to update restaurant: ' + error.message);
      }
    },
    createMenuItem: async (_, { restaurantId, name, description, price, category, imageUrl, imageHint, isAvailable, isVegetarian, isVegan, allergens }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify restaurant ownership
        const restaurantDoc = await db.collection('eateries').doc(restaurantId).get();
        if (!restaurantDoc.exists) throw new Error('Restaurant not found');
        if (restaurantDoc.data().ownerId !== user.uid) throw new Error('Access denied: Can only manage menu for your own restaurants');

        const menuItemData = {
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

        const docRef = await db.collection('eateries').doc(restaurantId).collection('menu_items').add(menuItemData);

        return {
          id: docRef.id,
          restaurantId,
          ...menuItemData,
        };
      } catch (error) {
        console.error('Error creating menu item:', error);
        throw new Error('Failed to create menu item: ' + error.message);
      }
    },
    updateMenuItem: async (_, { id, name, description, price, category, imageUrl, imageHint, isAvailable, isVegetarian, isVegan, allergens }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Find the restaurant that contains this menu item
        const eateriesSnapshot = await db.collection('eateries').where('ownerId', '==', user.uid).get();
        let menuItemRef = null;
        let restaurantId = null;

        for (const eateryDoc of eateriesSnapshot.docs) {
          const itemDoc = await eateryDoc.ref.collection('menu_items').doc(id).get();
          if (itemDoc.exists) {
            menuItemRef = itemDoc.ref;
            restaurantId = eateryDoc.id;
            break;
          }
        }

        if (!menuItemRef) throw new Error('Menu item not found or access denied');

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

        await menuItemRef.update(updateData);

        const updatedDoc = await menuItemRef.get();
        const updatedData = updatedDoc.data();

        return {
          id: updatedDoc.id,
          restaurantId,
          ...updatedData,
          isAvailable: updatedData.isAvailable !== false,
          isVegetarian: updatedData.isVegetarian || false,
          isVegan: updatedData.isVegan || false,
          allergens: updatedData.allergens || [],
        };
      } catch (error) {
        console.error('Error updating menu item:', error);
        throw new Error('Failed to update menu item: ' + error.message);
      }
    },
    deleteMenuItem: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Find and delete the menu item from owner's restaurants
        const eateriesSnapshot = await db.collection('eateries').where('ownerId', '==', user.uid).get();

        for (const eateryDoc of eateriesSnapshot.docs) {
          const itemDoc = await eateryDoc.ref.collection('menu_items').doc(id).get();
          if (itemDoc.exists) {
            await itemDoc.ref.delete();
            return true;
          }
        }

        throw new Error('Menu item not found or access denied');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        throw new Error('Failed to delete menu item: ' + error.message);
      }
    },
    createMenuCategory: async (_, { restaurantId, name, description, displayOrder }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Verify restaurant ownership
        const restaurantDoc = await db.collection('eateries').doc(restaurantId).get();
        if (!restaurantDoc.exists) throw new Error('Restaurant not found');
        if (restaurantDoc.data().ownerId !== user.uid) throw new Error('Access denied: Can only manage categories for your own restaurants');

        const categoryData = {
          name,
          description: description || '',
          displayOrder: displayOrder || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const docRef = await db.collection('eateries').doc(restaurantId).collection('menu_categories').add(categoryData);

        return {
          id: docRef.id,
          restaurantId,
          ...categoryData,
        };
      } catch (error) {
        console.error('Error creating menu category:', error);
        throw new Error('Failed to create menu category: ' + error.message);
      }
    },
    updateMenuCategory: async (_, { id, name, description, displayOrder }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Find the restaurant that contains this category
        const eateriesSnapshot = await db.collection('eateries').where('ownerId', '==', user.uid).get();
        let categoryRef = null;
        let restaurantId = null;

        for (const eateryDoc of eateriesSnapshot.docs) {
          const categoryDoc = await eateryDoc.ref.collection('menu_categories').doc(id).get();
          if (categoryDoc.exists) {
            categoryRef = categoryDoc.ref;
            restaurantId = eateryDoc.id;
            break;
          }
        }

        if (!categoryRef) throw new Error('Menu category not found or access denied');

        const updateData = { updatedAt: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

        await categoryRef.update(updateData);

        const updatedDoc = await categoryRef.get();
        const updatedData = updatedDoc.data();

        return {
          id: updatedDoc.id,
          restaurantId,
          ...updatedData,
          displayOrder: updatedData.displayOrder || 0,
        };
      } catch (error) {
        console.error('Error updating menu category:', error);
        throw new Error('Failed to update menu category: ' + error.message);
      }
    },
    deleteMenuCategory: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');

      try {
        // Find and delete the category from owner's restaurants
        const eateriesSnapshot = await db.collection('eateries').where('ownerId', '==', user.uid).get();

        for (const eateryDoc of eateriesSnapshot.docs) {
          const categoryDoc = await eateryDoc.ref.collection('menu_categories').doc(id).get();
          if (categoryDoc.exists) {
            await categoryDoc.ref.delete();
            return true;
          }
        }

        throw new Error('Menu category not found or access denied');
      } catch (error) {
        console.error('Error deleting menu category:', error);
        throw new Error('Failed to delete menu category: ' + error.message);
      }
    },
  },
  Subscription: {
    orderStatusUpdated: {
      subscribe: async (_, { orderId }, { user }) => {
        if (!user) throw new Error('Authentication required');

        // Verify user has access to this order
        try {
          const orderRef = db.collection('orders').doc(orderId);
          const orderDoc = await orderRef.get();

          if (!orderDoc.exists) {
            throw new Error('Order not found');
          }

          const orderData = orderDoc.data();
          // Allow access if user is the order owner or matches email/phone
          const hasAccess = 
            orderData.userId === user.uid ||
            orderData.customer?.email === user.email ||
            orderData.customer?.phone === user.phone_number;

          if (!hasAccess) {
            throw new Error('Access denied: Can only subscribe to your own orders');
          }

          console.log(`✅ User ${user.uid} subscribed to order ${orderId} status updates`);
          
          return pubsub.asyncIterator([ORDER_STATUS_UPDATED]);
        } catch (error) {
          console.error('Subscription auth error:', error);
          throw error;
        }
      },
      resolve: (payload, args) => {
        // Only send updates for the specific order the user subscribed to
        if (payload.orderStatusUpdated.id === args.orderId) {
          return payload.orderStatusUpdated;
        }
        return null;
      },
    },
  },
};

// Helper function to get user by ID
async function getUserById(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    const addressesSnapshot = await db.collection('addresses').where('userId', '==', uid).get();
    const addresses = addressesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      id: uid,
      uid,
      email: userData.email,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber,
      photoURL: userData.photoURL,
      addresses,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

module.exports = { typeDefs, resolvers, pubsub };