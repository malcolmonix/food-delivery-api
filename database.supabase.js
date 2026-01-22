/**
 * Supabase Database Module
 * Provides persistent database solution using Supabase (PostgreSQL)
 * Replaces Firebase Firestore to solve retrieval and server-side issues.
 */

const { supabase } = require('./supabase');

/**
 * Helper function to generate unique ID (UUID or custom)
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Supabase Database Helpers
 * Provides the same interface as the Firestore version for seamless transition
 */
const dbHelpers = {
    // ==================== USER OPERATIONS ====================

    async createUser(userData) {
        const id = userData.uid;
        const { data, error } = await supabase
            .from('users')
            .upsert({
                id,
                uid: userData.uid,
                email: userData.email,
                password: userData.password, // Optional: if still using custom passwords
                display_name: userData.displayName || null,
                phone_number: userData.phoneNumber || null,
                photo_url: userData.photoURL || null,
                created_at: userData.createdAt || new Date().toISOString(),
                updated_at: userData.updatedAt || new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase createUser error:', error);
            throw error;
        }
        return id;
    },

    async getUserByUid(uid) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('uid', uid)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is code for no rows found
            console.error('❌ Supabase getUserByUid error:', error);
            return null;
        }

        if (!data) return null;

        return {
            ...data,
            displayName: data.display_name,
            phoneNumber: data.phone_number,
            photoURL: data.photo_url,
            vehicleType: data.vehicle_type,
            licensePlate: data.license_plate,
            secondaryPhone: data.secondary_phone,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async getUserByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getUserByEmail error:', error);
            return null;
        }

        if (!data) return null;

        return {
            ...data,
            displayName: data.display_name,
            phoneNumber: data.phone_number,
            photoURL: data.photo_url,
            vehicleType: data.vehicle_type,
            licensePlate: data.license_plate,
            secondaryPhone: data.secondary_phone,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async updateUser(uid, updates) {
        const { uid: _, id: __, ...cleanUpdates } = updates;

        // Standardize keys to snake_case for Postgres
        const mappedUpdates = {
            display_name: cleanUpdates.displayName,
            phone_number: cleanUpdates.phoneNumber,
            photo_url: cleanUpdates.photoURL,
            vehicle_type: cleanUpdates.vehicleType,
            license_plate: cleanUpdates.licensePlate,
            secondary_phone: cleanUpdates.secondaryPhone,
            updated_at: new Date().toISOString(),
            ...cleanUpdates
        };

        // Remove the original camelCase keys if they exist in mappedUpdates
        delete mappedUpdates.displayName;
        delete mappedUpdates.phoneNumber;
        delete mappedUpdates.photoURL;
        delete mappedUpdates.vehicleType;
        delete mappedUpdates.licensePlate;
        delete mappedUpdates.secondaryPhone;

        const { error } = await supabase
            .from('users')
            .update(mappedUpdates)
            .eq('uid', uid);

        if (error) {
            console.error('❌ Supabase updateUser error:', error);
            throw error;
        }
    },

    // ==================== ADDRESS OPERATIONS ====================

    async createAddress(addressData) {
        const id = generateId();
        const { error } = await supabase
            .from('addresses')
            .insert({
                id,
                user_id: addressData.userId,
                label: addressData.label,
                street: addressData.street,
                city: addressData.city,
                state: addressData.state,
                zip_code: addressData.zipCode,
                country: addressData.country,
                latitude: addressData.latitude || null,
                longitude: addressData.longitude || null,
                is_default: addressData.isDefault || false,
                created_at: addressData.createdAt || new Date().toISOString(),
                updated_at: addressData.updatedAt || new Date().toISOString()
            });

        if (error) {
            console.error('❌ Supabase createAddress error:', error);
            throw error;
        }
        return id;
    },

    async getAddressesByUserId(userId) {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Supabase getAddressesByUserId error:', error);
            return [];
        }

        return data.map(addr => ({
            ...addr,
            userId: addr.user_id,
            zipCode: addr.zip_code,
            isDefault: addr.is_default,
            createdAt: addr.created_at,
            updatedAt: addr.updated_at
        }));
    },

    async getAddressById(id) {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getAddressById error:', error);
            return null;
        }

        if (!data) return null;

        return {
            ...data,
            userId: data.user_id,
            zipCode: data.zip_code,
            isDefault: data.is_default,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async updateAddress(id, updates) {
        const { id: _, ...cleanUpdates } = updates;

        const mappedUpdates = {
            user_id: cleanUpdates.userId,
            zip_code: cleanUpdates.zipCode,
            is_default: cleanUpdates.isDefault,
            updated_at: new Date().toISOString(),
            ...cleanUpdates
        };

        delete mappedUpdates.userId;
        delete mappedUpdates.zipCode;
        delete mappedUpdates.isDefault;

        const { error } = await supabase
            .from('addresses')
            .update(mappedUpdates)
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase updateAddress error:', error);
            throw error;
        }
    },

    async deleteAddress(id) {
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase deleteAddress error:', error);
            throw error;
        }
    },

    async unsetDefaultAddresses(userId) {
        const { error } = await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Supabase unsetDefaultAddresses error:', error);
            throw error;
        }
    },

    // ==================== RESTAURANT OPERATIONS ====================

    async createRestaurant(restaurantData) {
        const id = generateId();
        const { error } = await supabase
            .from('restaurants')
            .insert({
                id,
                name: restaurantData.name,
                description: restaurantData.description,
                logo_url: restaurantData.logoUrl || null,
                banner_url: restaurantData.bannerUrl || null,
                contact_email: restaurantData.contactEmail || null,
                phone_number: restaurantData.phoneNumber || null,
                address: restaurantData.address || null,
                latitude: restaurantData.latitude || null,
                longitude: restaurantData.longitude || null,
                cuisine: restaurantData.cuisine || [],
                price_range: restaurantData.priceRange || null,
                rating: restaurantData.rating || null,
                review_count: restaurantData.reviewCount || 0,
                is_active: restaurantData.isActive !== false,
                opening_hours: restaurantData.openingHours || [],
                owner_id: restaurantData.ownerId,
                created_at: restaurantData.createdAt || new Date().toISOString(),
                updated_at: restaurantData.updatedAt || new Date().toISOString()
            });

        if (error) {
            console.error('❌ Supabase createRestaurant error:', error);
            throw error;
        }
        return id;
    },

    async getRestaurants(filters = {}) {
        let query = supabase.from('restaurants').select('*');

        if (filters.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive);
        }

        if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }

        if (filters.cuisine) {
            query = query.contains('cuisine', [filters.cuisine]);
        }

        if (filters.city) {
            query = query.ilike('address', `%${filters.city}%`);
        }

        // Location-based filtering is harder in plain Supabase JS without PostGIS
        // For now, we'll fetch and filter in memory if lat/lng/radius are provided
        // or just return all and let the haversine filter run in JS

        let { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase getRestaurants error:', error);
            return [];
        }

        let results = data.map(r => ({
            ...r,
            logoUrl: r.logo_url,
            bannerUrl: r.banner_url,
            contactEmail: r.contact_email,
            phoneNumber: r.phone_number,
            priceRange: r.price_range,
            reviewCount: r.review_count,
            isActive: r.is_active,
            openingHours: r.opening_hours,
            ownerId: r.owner_id,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));

        // Location-based in-memory filtering (same as Firestore version)
        if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusMeters) {
            const lat = parseFloat(filters.lat);
            const lng = parseFloat(filters.lng);
            const radiusMeters = parseFloat(filters.radiusMeters);

            results = results.filter(r => {
                if (!r.latitude || !r.longitude) return false;
                const R = 6371000;
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

        if (filters.offset) results = results.slice(filters.offset);
        if (filters.limit) results = results.slice(0, filters.limit);

        return results;
    },

    async getRestaurantById(id) {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getRestaurantById error:', error);
            return null;
        }
        if (!data) return null;

        return {
            ...data,
            logoUrl: data.logo_url,
            bannerUrl: data.banner_url,
            contactEmail: data.contact_email,
            phoneNumber: data.phone_number,
            priceRange: data.price_range,
            reviewCount: data.review_count,
            isActive: data.is_active,
            openingHours: data.opening_hours,
            ownerId: data.owner_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async getRestaurantByOwnerId(ownerId) {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('owner_id', ownerId)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getRestaurantByOwnerId error:', error);
            return null;
        }
        if (!data) return null;

        return {
            ...data,
            logoUrl: data.logo_url,
            bannerUrl: data.banner_url,
            contactEmail: data.contact_email,
            phoneNumber: data.phone_number,
            priceRange: data.price_range,
            reviewCount: data.review_count,
            isActive: data.is_active,
            openingHours: data.opening_hours,
            ownerId: data.owner_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async getRestaurantsByLocation(filters = {}) {
        return this.getRestaurants(filters);
    },

    async updateRestaurant(id, updates) {
        const { id: _, ...cleanUpdates } = updates;
        const mappedUpdates = {
            logo_url: cleanUpdates.logoUrl,
            banner_url: cleanUpdates.bannerUrl,
            contact_email: cleanUpdates.contactEmail,
            phone_number: cleanUpdates.phoneNumber,
            price_range: cleanUpdates.priceRange,
            is_active: cleanUpdates.isActive,
            opening_hours: cleanUpdates.openingHours,
            updated_at: new Date().toISOString(),
            ...cleanUpdates
        };

        delete mappedUpdates.logoUrl;
        delete mappedUpdates.bannerUrl;
        delete mappedUpdates.contactEmail;
        delete mappedUpdates.phoneNumber;
        delete mappedUpdates.priceRange;
        delete mappedUpdates.isActive;
        delete mappedUpdates.openingHours;

        const { error } = await supabase
            .from('restaurants')
            .update(mappedUpdates)
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase updateRestaurant error:', error);
            throw error;
        }
    },

    // ==================== MENU ITEM OPERATIONS ====================

    async createMenuItem(menuItemData) {
        const id = generateId();
        const { error } = await supabase
            .from('menu_items')
            .insert({
                id,
                restaurant_id: menuItemData.restaurantId,
                name: menuItemData.name,
                description: menuItemData.description || '',
                price: menuItemData.price,
                category: menuItemData.category,
                image_url: menuItemData.imageUrl || null,
                image_hint: menuItemData.imageHint || null,
                is_available: menuItemData.isAvailable !== false,
                is_vegetarian: menuItemData.isVegetarian || false,
                is_vegan: menuItemData.isVegan || false,
                allergens: menuItemData.allergens || [],
                created_at: menuItemData.createdAt || new Date().toISOString(),
                updated_at: menuItemData.updatedAt || new Date().toISOString()
            });

        if (error) {
            console.error('❌ Supabase createMenuItem error:', error);
            throw error;
        }
        return id;
    },

    async getMenuItemsByRestaurantId(restaurantId) {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (error) {
            console.error('❌ Supabase getMenuItemsByRestaurantId error:', error);
            return [];
        }

        return data.map(item => ({
            ...item,
            restaurantId: item.restaurant_id,
            imageUrl: item.image_url,
            imageHint: item.image_hint,
            isAvailable: item.is_available,
            isVegetarian: item.is_vegetarian,
            isVegan: item.is_vegan,
            createdAt: item.created_at,
            updatedAt: item.updated_at
        }));
    },

    async getMenuItemById(id) {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getMenuItemById error:', error);
            return null;
        }
        if (!data) return null;

        return {
            ...data,
            restaurantId: data.restaurant_id,
            imageUrl: data.image_url,
            imageHint: data.image_hint,
            isAvailable: data.is_available,
            isVegetarian: data.is_vegetarian,
            isVegan: data.is_vegan,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async updateMenuItem(id, updates) {
        const { id: _, ...cleanUpdates } = updates;
        const mappedUpdates = {
            image_url: cleanUpdates.imageUrl,
            image_hint: cleanUpdates.imageHint,
            is_available: cleanUpdates.isAvailable,
            is_vegetarian: cleanUpdates.isVegetarian,
            is_vegan: cleanUpdates.isVegan,
            updated_at: new Date().toISOString(),
            ...cleanUpdates
        };

        delete mappedUpdates.imageUrl;
        delete mappedUpdates.imageHint;
        delete mappedUpdates.isAvailable;
        delete mappedUpdates.isVegetarian;
        delete mappedUpdates.isVegan;

        const { error } = await supabase
            .from('menu_items')
            .update(mappedUpdates)
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase updateMenuItem error:', error);
            throw error;
        }
    },

    async deleteMenuItem(id) {
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase deleteMenuItem error:', error);
            throw error;
        }
    },

    // ==================== MENU CATEGORY OPERATIONS ====================

    async createMenuCategory(categoryData) {
        const id = generateId();
        const { error } = await supabase
            .from('menu_categories')
            .insert({
                id,
                restaurant_id: categoryData.restaurantId,
                name: categoryData.name,
                description: categoryData.description || '',
                display_order: categoryData.displayOrder || 0,
                created_at: categoryData.createdAt || new Date().toISOString(),
                updated_at: categoryData.updatedAt || new Date().toISOString()
            });

        if (error) {
            console.error('❌ Supabase createMenuCategory error:', error);
            throw error;
        }
        return id;
    },

    async getMenuCategoriesByRestaurantId(restaurantId) {
        const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('❌ Supabase getMenuCategoriesByRestaurantId error:', error);
            return [];
        }

        return data.map(cat => ({
            ...cat,
            restaurantId: cat.restaurant_id,
            displayOrder: cat.display_order,
            createdAt: cat.created_at,
            updatedAt: cat.updated_at
        }));
    },

    async getMenuCategoryById(id) {
        const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getMenuCategoryById error:', error);
            return null;
        }
        if (!data) return null;

        return {
            ...data,
            restaurantId: data.restaurant_id,
            displayOrder: data.display_order,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async updateMenuCategory(id, updates) {
        const { id: _, ...cleanUpdates } = updates;
        const mappedUpdates = {
            display_order: cleanUpdates.displayOrder,
            updated_at: new Date().toISOString(),
            ...cleanUpdates
        };

        delete mappedUpdates.displayOrder;

        const { error } = await supabase
            .from('menu_categories')
            .update(mappedUpdates)
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase updateMenuCategory error:', error);
            throw error;
        }
    },

    async deleteMenuCategory(id) {
        const { error } = await supabase
            .from('menu_categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase deleteMenuCategory error:', error);
            throw error;
        }
    },

    // ==================== ORDER OPERATIONS ====================

    async createOrder(orderData) {
        const id = generateId();
        const { error } = await supabase
            .from('orders')
            .insert({
                id,
                order_id: orderData.orderId,
                user_id: orderData.userId,
                rider_id: orderData.riderId || null,
                restaurant: orderData.restaurant,
                order_items: orderData.orderItems, // JSONB
                order_amount: orderData.orderAmount,
                paid_amount: orderData.paidAmount,
                payment_method: orderData.paymentMethod,
                order_status: orderData.orderStatus,
                order_date: orderData.orderDate,
                expected_time: orderData.expectedTime || null,
                is_picked_up: orderData.isPickedUp || false,
                pickup_code: orderData.pickupCode || null,
                payment_processed: orderData.paymentProcessed || false,
                delivery_charges: orderData.deliveryCharges || 0,
                tipping: orderData.tipping || 0,
                taxation_amount: orderData.taxationAmount || 0,
                address: orderData.address || null,
                instructions: orderData.instructions || null,
                coupon_code: orderData.couponCode || null,
                status_history: orderData.statusHistory || [], // JSONB
                created_at: orderData.createdAt || new Date().toISOString(),
                updated_at: orderData.updatedAt || new Date().toISOString(),
                customer_info: orderData.customer || null // JSONB
            });

        if (error) {
            console.error('❌ Supabase createOrder error:', error);
            throw error;
        }
        return id;
    },

    async getOrdersByUserId(userId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase getOrdersByUserId error:', error);
            return [];
        }

        return data.map(order => this._mapOrder(order));
    },

    async getOrderById(id) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getOrderById error:', error);
            return null;
        }
        if (!data) return null;

        return this._mapOrder(data);
    },

    async getOrderByOrderId(orderId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getOrderByOrderId error:', error);
            return null;
        }
        if (!data) return null;

        return this._mapOrder(data);
    },

    async getOrdersByRiderId(riderId) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('rider_id', riderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase getOrdersByRiderId error:', error);
            return [];
        }

        return data.map(order => this._mapOrder(order));
    },

    async getAvailableOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_status', 'READY')
            .is('rider_id', null)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Supabase getAvailableOrders error:', error);
            return [];
        }

        return data.map(order => this._mapOrder(order));
    },

    async updateOrder(id, updates) {
        const { id: _, ...cleanUpdates } = updates;
        const mappedUpdates = {
            order_id: cleanUpdates.orderId,
            user_id: cleanUpdates.userId,
            rider_id: cleanUpdates.riderId,
            order_items: cleanUpdates.orderItems,
            order_amount: cleanUpdates.orderAmount,
            paid_amount: cleanUpdates.paidAmount,
            payment_method: cleanUpdates.paymentMethod,
            order_status: cleanUpdates.orderStatus,
            order_date: cleanUpdates.orderDate,
            expected_time: cleanUpdates.expectedTime,
            is_picked_up: cleanUpdates.isPickedUp,
            pickup_code: cleanUpdates.pickupCode,
            payment_processed: cleanUpdates.paymentProcessed,
            delivery_charges: cleanUpdates.deliveryCharges,
            tipping: cleanUpdates.tipping,
            taxation_amount: cleanUpdates.taxationAmount,
            coupon_code: cleanUpdates.couponCode,
            status_history: cleanUpdates.statusHistory,
            customer_info: cleanUpdates.customer,
            updated_at: new Date().toISOString(),
            ...cleanUpdates
        };

        // Remove camelCase keys
        Object.keys(cleanUpdates).forEach(key => {
            if (/^[a-z]+[A-Z]/.test(key)) delete mappedUpdates[key];
        });

        const { error } = await supabase
            .from('orders')
            .update(mappedUpdates)
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase updateOrder error:', error);
            throw error;
        }
    },

    _mapOrder(order) {
        return {
            ...order,
            orderId: order.order_id,
            userId: order.user_id,
            riderId: order.rider_id,
            orderItems: order.order_items,
            orderAmount: order.order_amount,
            paidAmount: order.paid_amount,
            paymentMethod: order.payment_method,
            orderStatus: order.order_status,
            orderDate: order.order_date,
            expectedTime: order.expected_time,
            isPickedUp: order.is_picked_up,
            pickupCode: order.pickup_code,
            paymentProcessed: order.payment_processed,
            deliveryCharges: order.delivery_charges,
            tipping: order.tipping,
            taxationAmount: order.taxation_amount,
            couponCode: order.coupon_code,
            statusHistory: order.status_history,
            customer: order.customer_info,
            createdAt: order.created_at,
            updatedAt: order.updated_at
        };
    },

    // ==================== RIDE OPERATIONS ====================

    async createRideRequest(rideData) {
        return this.createRide(rideData);
    },

    async createRide(rideData) {
        const id = generateId();
        const rideId = `RIDE-${Date.now()}`;
        const rideDoc = {
            id,
            ride_id: rideId,
            user_id: rideData.userId,
            rider_id: rideData.riderId || null,
            pickup_address: rideData.pickupAddress,
            pickup_lat: rideData.pickupLat,
            pickup_lng: rideData.pickupLng,
            dropoff_address: rideData.dropoffAddress,
            dropoff_lat: rideData.dropoffLat,
            dropoff_lng: rideData.dropoffLng,
            status: rideData.status || 'REQUESTED',
            fare: rideData.fare,
            offers: rideData.offers || [],
            distance: rideData.distance,
            duration: rideData.duration,
            payment_method: rideData.paymentMethod || null,
            rating: rideData.rating || null,
            feedback: rideData.feedback || null,
            delivery_code: rideData.deliveryCode || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('rides').insert(rideDoc);

        if (error) {
            console.error('❌ Supabase createRide error:', error);
            throw error;
        }

        return this._mapRide(rideDoc);
    },

    async getRideById(id) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getRideById error:', error);
            return null;
        }
        if (!data) return null;

        return this._mapRide(data);
    },

    async getRideByRideId(rideId) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('ride_id', rideId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('❌ Supabase getRideByRideId error:', error);
            return null;
        }
        if (!data) return null;

        return this._mapRide(data);
    },

    async getRidesByUserId(userId) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase getRidesByUserId error:', error);
            return [];
        }

        return data.map(ride => this._mapRide(ride));
    },

    async getRidesByRiderId(riderId) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('rider_id', riderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase getRidesByRiderId error:', error);
            return [];
        }

        return data.map(ride => this._mapRide(ride));
    },

    async getAvailableRides() {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('status', 'REQUESTED')
            .is('rider_id', null)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Supabase getAvailableRides error:', error);
            return [];
        }

        return data.map(ride => this._mapRide(ride));
    },

    async updateRide(id, updates) {
        const { id: _, ...cleanUpdates } = updates;
        const mappedUpdates = {
            status: cleanUpdates.status,
            rider_id: cleanUpdates.riderId,
            rating: cleanUpdates.rating,
            feedback: cleanUpdates.feedback,
            delivery_code: cleanUpdates.deliveryCode,
            updated_at: new Date().toISOString()
        };

        // Add any other updates
        Object.keys(cleanUpdates).forEach(key => {
            if (!mappedUpdates.hasOwnProperty(key)) {
                // Should probably map camelCase to snake_case here too
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                mappedUpdates[snakeKey] = cleanUpdates[key];
            }
        });

        const { error } = await supabase
            .from('rides')
            .update(mappedUpdates)
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase updateRide error:', error);
            throw error;
        }

        return this.getRideById(id);
    },

    async deleteRide(id) {
        const { error } = await supabase
            .from('rides')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase deleteRide error:', error);
            throw error;
        }

        console.log(`✅ Ride ${id} deleted from database`);
        return true;
    },

    async acceptRide(rideId, riderId) {
        let id = rideId;
        let ride = null;

        if (typeof rideId === 'string' && rideId.startsWith('RIDE-')) {
            ride = await this.getRideByRideId(rideId);
            if (ride) id = ride.id;
        } else {
            ride = await this.getRideById(rideId);
        }

        if (!ride) throw new Error('Ride not found');

        // Prevent race condition: Ensure ride is still REQUESTED and has no rider
        if (ride.status !== 'REQUESTED' || ride.riderId) {
            console.warn(`🛑 Ride ${rideId} already accepted by ${ride.riderId}. Request by ${riderId} denied.`);
            return null; // Return null to indicate failure (or throw error)
        }

        const riderInfo = await this.getUserByUid(riderId);

        return this.updateRide(id, {
            riderId,
            riderName: riderInfo?.displayName || 'Unknown Rider',
            riderPhone: riderInfo?.phoneNumber || null,
            riderPhoto: riderInfo?.photoURL || null,
            status: 'ACCEPTED',
            acceptedAt: new Date().toISOString()
        });
    },

    async updateRideStatus(rideId, status) {
        // In Supabase, we use id usually, but for backward compatibility
        // we might receive ride_id or internal id.
        let id = rideId;
        if (typeof rideId === 'string' && rideId.startsWith('RIDE-')) {
            const ride = await this.getRideByRideId(rideId);
            if (ride) id = ride.id;
        }

        return this.updateRide(id, { status });
    },

    async completeRide(rideId, ratingData = {}) {
        let id = rideId;
        if (typeof rideId === 'string' && rideId.startsWith('RIDE-')) {
            const ride = await this.getRideByRideId(rideId);
            if (ride) id = ride.id;
        }

        return this.updateRide(id, {
            status: 'COMPLETED',
            ...ratingData,
            completedAt: new Date().toISOString()
        });
    },

    async getAcceptedRidesByRider(riderId) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('rider_id', riderId)
            .in('status', ['ACCEPTED', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'ARRIVED_AT_DROPOFF']);

        if (error) {
            console.error('❌ Supabase getAcceptedRidesByRider error:', error);
            return [];
        }
        return data.map(r => this._mapRide(r));
    },

    async getAcceptedRidesByCustomer(userId) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['ACCEPTED', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'ARRIVED_AT_DROPOFF']);

        if (error) {
            console.error('❌ Supabase getAcceptedRidesByCustomer error:', error);
            return [];
        }
        return data.map(r => this._mapRide(r));
    },

    async updateUserLocation(uid, latitude, longitude) {
        const { error } = await supabase
            .from('users')
            .update({
                latitude,
                longitude,
                last_location_update: new Date().toISOString()
            })
            .eq('uid', uid);

        if (error) {
            console.error('❌ Supabase updateUserLocation error:', error);
            throw error;
        }
    },

    async updateRiderStatus(uid, isOnline) {
        const { error } = await supabase
            .from('users')
            .update({
                is_online: isOnline,
                last_status_update: new Date().toISOString()
            })
            .eq('uid', uid);

        if (error) {
            console.error('❌ Supabase updateRiderStatus error:', error);
            throw error;
        }
    },

    _mapRide(ride) {
        if (!ride) return null;
        return {
            ...ride,
            rideId: ride.ride_id || ride.rideId,
            userId: ride.user_id || ride.userId,
            riderId: ride.rider_id || ride.riderId,
            pickupAddress: ride.pickup_address || ride.pickupAddress,
            pickupLat: ride.pickup_lat || ride.pickupLat,
            pickupLng: ride.pickup_lng || ride.pickupLng,
            dropoffAddress: ride.dropoff_address || ride.dropoffAddress,
            dropoffLat: ride.dropoff_lat || ride.dropoffLat,
            dropoffLng: ride.dropoff_lng || ride.dropoffLng,
            paymentMethod: ride.payment_method || ride.paymentMethod,
            deliveryCode: ride.delivery_code || ride.deliveryCode,
            offers: ride.offers || [],
            createdAt: ride.created_at || ride.createdAt,
            updatedAt: ride.updated_at || ride.updatedAt
        };
    },

    // ==================== PHASE 3 RIDE OPERATIONS ====================
    // These were complex in Firestore, simpler in Supabase due to SQL

    async getPendingRides() {
        return this.getAvailableRides();
    },

    async getActiveRideForCustomer(userId) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['REQUESTED', 'ACCEPTED', 'ARRIVED_AT_PICKUP', 'PICKED_UP'])
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') return null;
        return this._mapRide(data);
    },

    async getRideHistory(userId, userType = 'customer', limit = 20, offset = 0) {
        const field = userType === 'customer' ? 'user_id' : 'rider_id';
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq(field, userId)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return [];
        return data.map(ride => this._mapRide(ride));
    },

    async getRiderEarnings(riderId, periodDays = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('rider_id', riderId)
            .eq('status', 'COMPLETED')
            .gte('created_at', startDate.toISOString());

        if (error) return null;

        const rides = data.map(ride => this._mapRide(ride));
        const totalEarnings = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
        const totalRides = rides.length;

        return {
            totalEarnings,
            totalRides,
            averagePerRide: totalRides > 0 ? totalEarnings / totalRides : 0,
            rides
        };
    },

    // ==================== MESSAGE OPERATIONS ====================

    async getMessagesByRideId(rideId) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ride_id', rideId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Supabase getMessagesByRideId error:', error);
            return [];
        }

        return data.map(msg => ({
            ...msg,
            rideId: msg.ride_id,
            senderId: msg.sender_id,
            createdAt: msg.created_at
        }));
    },

    async createMessage(rideId, senderId, text) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                ride_id: rideId,
                sender_id: senderId,
                text
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase createMessage error:', error);
            throw error;
        }

        return {
            ...data,
            rideId: data.ride_id,
            senderId: data.sender_id,
            createdAt: data.created_at
        };
    }
};

// Export a mock db object for compatibility with existing code
const mockDb = {
    prepare: () => {
        throw new Error('Direct database queries not supported. Use dbHelpers instead.');
    }
};

module.exports = { db: mockDb, dbHelpers, generateId };
