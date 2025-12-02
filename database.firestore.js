/**
 * Firestore Database Module
 * Provides persistent database solution using Firebase Firestore
 * Perfect for Vercel deployment - data persists across function invocations
 */

const { admin } = require('./firebase');

// Get Firestore instance
const db = admin.firestore();

console.log('🔥 Firestore database initialized');

/**
 * Helper function to generate unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Firestore Database Helpers
 * Provides the same interface as the SQLite version for easy migration
 */
const dbHelpers = {
    // ==================== USER OPERATIONS ====================

    async createUser(userData) {
        const id = userData.uid;
        const userRef = db.collection('users').doc(id);

        const userDoc = {
            id,
            uid: userData.uid,
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName || null,
            phoneNumber: userData.phoneNumber || null,
            photoURL: userData.photoURL || null,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
        };

        await userRef.set(userDoc);
        return id;
    },

    async getUserByUid(uid) {
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async getUserByEmail(email) {
        const snapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    async updateUser(uid, updates) {
        const userRef = db.collection('users').doc(uid);

        // Remove uid and id from updates
        const { uid: _, id: __, ...cleanUpdates } = updates;

        if (Object.keys(cleanUpdates).length === 0) return;

        await userRef.update({
            ...cleanUpdates,
            updatedAt: new Date().toISOString()
        });
    },

    // ==================== ADDRESS OPERATIONS ====================

    async createAddress(addressData) {
        const id = generateId();
        const addressRef = db.collection('addresses').doc(id);

        const addressDoc = {
            id,
            userId: addressData.userId,
            label: addressData.label,
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
            isDefault: addressData.isDefault || false,
            createdAt: addressData.createdAt,
            updatedAt: addressData.updatedAt
        };

        await addressRef.set(addressDoc);
        return id;
    },

    async getAddressesByUserId(userId) {
        const snapshot = await db.collection('addresses')
            .where('userId', '==', userId)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getAddressById(id) {
        const addressRef = db.collection('addresses').doc(id);
        const doc = await addressRef.get();

        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async updateAddress(id, updates) {
        const addressRef = db.collection('addresses').doc(id);

        const { id: _, ...cleanUpdates } = updates;

        if (Object.keys(cleanUpdates).length === 0) return;

        await addressRef.update({
            ...cleanUpdates,
            updatedAt: new Date().toISOString()
        });
    },

    async deleteAddress(id) {
        const addressRef = db.collection('addresses').doc(id);
        await addressRef.delete();
    },

    async unsetDefaultAddresses(userId) {
        const snapshot = await db.collection('addresses')
            .where('userId', '==', userId)
            .get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isDefault: false });
        });

        await batch.commit();
    },

    // ==================== RESTAURANT OPERATIONS ====================

    async createRestaurant(restaurantData) {
        const id = generateId();
        const restaurantRef = db.collection('restaurants').doc(id);

        const restaurantDoc = {
            id,
            name: restaurantData.name,
            description: restaurantData.description,
            logoUrl: restaurantData.logoUrl || null,
            bannerUrl: restaurantData.bannerUrl || null,
            contactEmail: restaurantData.contactEmail || null,
            phoneNumber: restaurantData.phoneNumber || null,
            address: restaurantData.address || null,
            latitude: restaurantData.latitude || null,
            longitude: restaurantData.longitude || null,
            cuisine: restaurantData.cuisine || [],
            priceRange: restaurantData.priceRange || null,
            rating: restaurantData.rating || null,
            reviewCount: restaurantData.reviewCount || 0,
            isActive: restaurantData.isActive !== false,
            openingHours: restaurantData.openingHours || [],
            ownerId: restaurantData.ownerId,
            createdAt: restaurantData.createdAt,
            updatedAt: restaurantData.updatedAt
        };

        await restaurantRef.set(restaurantDoc);
        return id;
    },

    async getRestaurants(filters = {}) {
        let query = db.collection('restaurants');

        // Apply filters
        if (filters.isActive !== undefined) {
            query = query.where('isActive', '==', filters.isActive);
        }

        // Note: Firestore doesn't support LIKE queries, so we'll fetch and filter in memory
        // For production, consider using Algolia or similar for advanced search

        let snapshot = await query.orderBy('createdAt', 'desc').get();
        let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Apply in-memory filters
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            results = results.filter(r =>
                r.name.toLowerCase().includes(searchLower)
            );
        }

        if (filters.cuisine) {
            results = results.filter(r =>
                r.cuisine && r.cuisine.includes(filters.cuisine)
            );
        }

        if (filters.city) {
            results = results.filter(r =>
                r.address && r.address.toLowerCase().includes(filters.city.toLowerCase())
            );
        }

        // Location-based filtering
        if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusMeters) {
            const lat = parseFloat(filters.lat);
            const lng = parseFloat(filters.lng);
            const radiusMeters = parseFloat(filters.radiusMeters);

            results = results.filter(r => {
                if (!r.latitude || !r.longitude) return false;

                // Haversine distance calculation
                const R = 6371000; // Earth's radius in meters
                const dLat = (r.latitude - lat) * Math.PI / 180;
                const dLng = (r.longitude - lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(r.latitude * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                return distance <= radiusMeters;
            });
        }

        // Apply pagination
        if (filters.offset) {
            results = results.slice(filters.offset);
        }

        if (filters.limit) {
            results = results.slice(0, filters.limit);
        }

        return results;
    },

    async getRestaurantById(id) {
        const restaurantRef = db.collection('restaurants').doc(id);
        const doc = await restaurantRef.get();

        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async getRestaurantByOwnerId(ownerId) {
        const snapshot = await db.collection('restaurants')
            .where('ownerId', '==', ownerId)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    async getRestaurantsByLocation(filters = {}) {
        // Reuse getRestaurants with location filters
        return this.getRestaurants(filters);
    },

    async updateRestaurant(id, updates) {
        const restaurantRef = db.collection('restaurants').doc(id);

        const { id: _, ...cleanUpdates } = updates;

        if (Object.keys(cleanUpdates).length === 0) return;

        await restaurantRef.update({
            ...cleanUpdates,
            updatedAt: new Date().toISOString()
        });
    },

    // ==================== MENU ITEM OPERATIONS ====================

    async createMenuItem(menuItemData) {
        const id = generateId();
        const menuItemRef = db.collection('menu_items').doc(id);

        const menuItemDoc = {
            id,
            restaurantId: menuItemData.restaurantId,
            name: menuItemData.name,
            description: menuItemData.description || '',
            price: menuItemData.price,
            category: menuItemData.category,
            imageUrl: menuItemData.imageUrl || null,
            imageHint: menuItemData.imageHint || null,
            isAvailable: menuItemData.isAvailable !== false,
            isVegetarian: menuItemData.isVegetarian || false,
            isVegan: menuItemData.isVegan || false,
            allergens: menuItemData.allergens || [],
            createdAt: menuItemData.createdAt,
            updatedAt: menuItemData.updatedAt
        };

        await menuItemRef.set(menuItemDoc);
        return id;
    },

    async getMenuItemsByRestaurantId(restaurantId) {
        const snapshot = await db.collection('menu_items')
            .where('restaurantId', '==', restaurantId)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getMenuItemById(id) {
        const menuItemRef = db.collection('menu_items').doc(id);
        const doc = await menuItemRef.get();

        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async updateMenuItem(id, updates) {
        const menuItemRef = db.collection('menu_items').doc(id);

        const { id: _, ...cleanUpdates } = updates;

        if (Object.keys(cleanUpdates).length === 0) return;

        await menuItemRef.update({
            ...cleanUpdates,
            updatedAt: new Date().toISOString()
        });
    },

    async deleteMenuItem(id) {
        const menuItemRef = db.collection('menu_items').doc(id);
        await menuItemRef.delete();
    },

    // ==================== MENU CATEGORY OPERATIONS ====================

    async createMenuCategory(categoryData) {
        const id = generateId();
        const categoryRef = db.collection('menu_categories').doc(id);

        const categoryDoc = {
            id,
            restaurantId: categoryData.restaurantId,
            name: categoryData.name,
            description: categoryData.description || '',
            displayOrder: categoryData.displayOrder || 0,
            createdAt: categoryData.createdAt,
            updatedAt: categoryData.updatedAt
        };

        await categoryRef.set(categoryDoc);
        return id;
    },

    async getMenuCategoriesByRestaurantId(restaurantId) {
        const snapshot = await db.collection('menu_categories')
            .where('restaurantId', '==', restaurantId)
            .orderBy('displayOrder', 'asc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getMenuCategoryById(id) {
        const categoryRef = db.collection('menu_categories').doc(id);
        const doc = await categoryRef.get();

        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async updateMenuCategory(id, updates) {
        const categoryRef = db.collection('menu_categories').doc(id);

        const { id: _, ...cleanUpdates } = updates;

        if (Object.keys(cleanUpdates).length === 0) return;

        await categoryRef.update({
            ...cleanUpdates,
            updatedAt: new Date().toISOString()
        });
    },

    async deleteMenuCategory(id) {
        const categoryRef = db.collection('menu_categories').doc(id);
        await categoryRef.delete();
    },

    // ==================== ORDER OPERATIONS ====================

    async createOrder(orderData) {
        const id = generateId();
        const orderRef = db.collection('orders').doc(id);

        const orderDoc = {
            id,
            orderId: orderData.orderId,
            userId: orderData.userId,
            riderId: orderData.riderId || null,
            restaurant: orderData.restaurant,
            orderItems: orderData.orderItems,
            orderAmount: orderData.orderAmount,
            paidAmount: orderData.paidAmount,
            paymentMethod: orderData.paymentMethod,
            orderStatus: orderData.orderStatus,
            orderDate: orderData.orderDate,
            expectedTime: orderData.expectedTime || null,
            isPickedUp: orderData.isPickedUp || false,
            pickupCode: orderData.pickupCode || null,
            paymentProcessed: orderData.paymentProcessed || false,
            deliveryCharges: orderData.deliveryCharges || 0,
            tipping: orderData.tipping || 0,
            taxationAmount: orderData.taxationAmount || 0,
            address: orderData.address || null,
            instructions: orderData.instructions || null,
            couponCode: orderData.couponCode || null,
            statusHistory: orderData.statusHistory || [],
            createdAt: orderData.createdAt,
            updatedAt: orderData.updatedAt
        };

        await orderRef.set(orderDoc);
        return id;
    },

    async getOrdersByUserId(userId) {
        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getOrderById(id) {
        const orderRef = db.collection('orders').doc(id);
        const doc = await orderRef.get();

        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async getOrdersByRiderId(riderId) {
        const snapshot = await db.collection('orders')
            .where('riderId', '==', riderId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getAvailableOrders() {
        const snapshot = await db.collection('orders')
            .where('orderStatus', '==', 'READY')
            .orderBy('createdAt', 'asc')
            .get();

        // Filter out orders that already have a rider
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(order => !order.riderId || order.riderId === '');
    },

    async updateOrder(id, updates) {
        const orderRef = db.collection('orders').doc(id);

        const { id: _, ...cleanUpdates } = updates;

        if (Object.keys(cleanUpdates).length === 0) return;

        await orderRef.update({
            ...cleanUpdates,
            updatedAt: new Date().toISOString()
        });
    },
};

// Export a mock db object for compatibility with existing code
// In Firestore, we don't need direct db access like SQLite
const mockDb = {
    prepare: () => {
        throw new Error('Direct database queries not supported with Firestore. Use dbHelpers instead.');
    }
};

module.exports = { db: mockDb, dbHelpers, generateId };
