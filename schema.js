const { gql } = require('apollo-server-express');
const { db, admin } = require('./firebase');

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
    me: async (_, __, { user }) => {
      if (!user) return null;
      return getUserById(user.uid);
    },
    orders: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      const ordersSnapshot = await db.collection('orders').where('userId', '==', user.uid).get();
      return ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          statusHistory: data.statusHistory || [],
          createdAt: data.createdAt || data.orderDate,
          updatedAt: data.updatedAt || data.orderDate,
        };
      });
    },
    order: async (_, { id }, { user }) => {
      if (!user) throw new Error('Authentication required');
      const orderDoc = await db.collection('orders').doc(id).get();
      if (!orderDoc.exists) return null;

      const data = orderDoc.data();
      // Check if order belongs to user
      if (data.userId !== user.uid) throw new Error('Access denied');

      return {
        id: orderDoc.id,
        ...data,
        statusHistory: data.statusHistory || [],
        createdAt: data.createdAt || data.orderDate,
        updatedAt: data.updatedAt || data.orderDate,
      };
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

        // Save to Firebase
        console.log('Attempting to save order to Firebase...');
        const docRef = await db.collection('orders').add(orderData);
        console.log('Order saved successfully with ID:', docRef.id);

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
        return {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        };
      } catch (error) {
        console.error('Error updating order status:', error);
        throw new Error('Failed to update order status: ' + error.message);
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

module.exports = { typeDefs, resolvers };