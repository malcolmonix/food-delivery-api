/**
 * Vercel-Compatible Database Module
 * Uses in-memory SQLite for serverless environment
 * ⚠️ WARNING: Data will NOT persist between function invocations!
 * This is a temporary solution - migrate to PostgreSQL or Firestore for production
 */

const Database = require('better-sqlite3');

// Use in-memory database for Vercel (data won't persist!)
const db = new Database(':memory:');

console.log('📦 In-memory SQLite database initialized (Vercel mode)');
console.log('⚠️  WARNING: Data will NOT persist between requests!');
console.log('⚠️  Please migrate to PostgreSQL or Firestore for production use');

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
function initializeDatabase() {
    console.log('🔧 Initializing database schema...');

    // Users table
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      uid TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      displayName TEXT,
      phoneNumber TEXT,
      photoURL TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

    // Addresses table
    db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      label TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zipCode TEXT NOT NULL,
      country TEXT NOT NULL,
      isDefault INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

    // Restaurants table
    db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      logoUrl TEXT,
      bannerUrl TEXT,
      contactEmail TEXT,
      phoneNumber TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      cuisine TEXT,
      priceRange TEXT,
      rating REAL,
      reviewCount INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      openingHours TEXT,
      ownerId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (ownerId) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

    // Order status codes (lookup table)
    db.exec(`
    CREATE TABLE IF NOT EXISTS order_status_codes (
      code TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

    // Delivery zones table (simple polygons stored as GeoJSON or center+radius)
    db.exec(`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT,
      centerLat REAL,
      centerLng REAL,
      radiusMeters INTEGER,
      geojson TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

    // Map restaurants to delivery zones
    db.exec(`
    CREATE TABLE IF NOT EXISTS restaurant_zones (
      id TEXT PRIMARY KEY,
      restaurantId TEXT NOT NULL,
      zoneId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (zoneId) REFERENCES delivery_zones(id) ON DELETE CASCADE
    )
  `);

    // Menu items table
    db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      restaurantId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      imageUrl TEXT,
      imageHint TEXT,
      isAvailable INTEGER DEFAULT 1,
      isVegetarian INTEGER DEFAULT 0,
      isVegan INTEGER DEFAULT 0,
      allergens TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
    )
  `);

    // Menu categories table
    db.exec(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id TEXT PRIMARY KEY,
      restaurantId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      displayOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE
    )
  `);

    // Orders table
    db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderId TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL,
      riderId TEXT,
      restaurant TEXT NOT NULL,
      orderItems TEXT NOT NULL,
      orderAmount REAL NOT NULL,
      paidAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      orderStatus TEXT NOT NULL,
      orderDate TEXT NOT NULL,
      expectedTime TEXT,
      isPickedUp INTEGER DEFAULT 0,
      pickupCode TEXT,
      paymentProcessed INTEGER DEFAULT 0,
      deliveryCharges REAL DEFAULT 0,
      tipping REAL DEFAULT 0,
      taxationAmount REAL DEFAULT 0,
      address TEXT,
      instructions TEXT,
      couponCode TEXT,
      statusHistory TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
    )
  `);

    // Create indexes for better query performance
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_addresses_userId ON addresses(userId);
    CREATE INDEX IF NOT EXISTS idx_restaurants_ownerId ON restaurants(ownerId);
    CREATE INDEX IF NOT EXISTS idx_restaurants_isActive ON restaurants(isActive);
    CREATE INDEX IF NOT EXISTS idx_menu_items_restaurantId ON menu_items(restaurantId);
    CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurantId ON menu_categories(restaurantId);
    CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
    CREATE INDEX IF NOT EXISTS idx_orders_orderId ON orders(orderId);
    CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(address);
    CREATE INDEX IF NOT EXISTS idx_zones_city ON delivery_zones(city);
  `);

    console.log('✅ Database schema initialized successfully');
}

// Initialize the database schema
initializeDatabase();

/**
 * Helper function to generate unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Database helper functions
 */
const dbHelpers = {
    // User operations
    createUser(userData) {
        const stmt = db.prepare(`
      INSERT INTO users (id, uid, email, password, displayName, phoneNumber, photoURL, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const id = userData.uid;
        stmt.run(
            id,
            userData.uid,
            userData.email,
            userData.password,
            userData.displayName || null,
            userData.phoneNumber || null,
            userData.photoURL || null,
            userData.createdAt,
            userData.updatedAt
        );
        return id;
    },

    getUserByUid(uid) {
        const stmt = db.prepare('SELECT * FROM users WHERE uid = ?');
        return stmt.get(uid);
    },

    getUserByEmail(email) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    },

    updateUser(uid, updates) {
        const fields = Object.keys(updates).filter(k => k !== 'uid' && k !== 'id');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => updates[f]);

        const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE uid = ?`);
        stmt.run(...values, uid);
    },

    // Address operations
    createAddress(addressData) {
        const id = generateId();
        const stmt = db.prepare(`
      INSERT INTO addresses (id, userId, label, street, city, state, zipCode, country, isDefault, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            id,
            addressData.userId,
            addressData.label,
            addressData.street,
            addressData.city,
            addressData.state,
            addressData.zipCode,
            addressData.country,
            addressData.isDefault ? 1 : 0,
            addressData.createdAt,
            addressData.updatedAt
        );
        return id;
    },

    getAddressesByUserId(userId) {
        const stmt = db.prepare('SELECT * FROM addresses WHERE userId = ?');
        return stmt.all(userId);
    },

    getAddressById(id) {
        const stmt = db.prepare('SELECT * FROM addresses WHERE id = ?');
        return stmt.get(id);
    },

    updateAddress(id, updates) {
        const fields = Object.keys(updates).filter(k => k !== 'id');
        if (fields.length === 0) return;

        const setClause = fields.map(f => {
            if (f === 'isDefault') return `${f} = ?`;
            return `${f} = ?`;
        }).join(', ');
        const values = fields.map(f => {
            if (f === 'isDefault') return updates[f] ? 1 : 0;
            return updates[f];
        });

        const stmt = db.prepare(`UPDATE addresses SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
    },

    deleteAddress(id) {
        const stmt = db.prepare('DELETE FROM addresses WHERE id = ?');
        stmt.run(id);
    },

    unsetDefaultAddresses(userId) {
        const stmt = db.prepare('UPDATE addresses SET isDefault = 0 WHERE userId = ?');
        stmt.run(userId);
    },

    // Restaurant operations
    createRestaurant(restaurantData) {
        const id = generateId();
        const stmt = db.prepare(`
      INSERT INTO restaurants (id, name, description, logoUrl, bannerUrl, contactEmail, phoneNumber, address, cuisine, priceRange, rating, reviewCount, isActive, openingHours, ownerId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            id,
            restaurantData.name,
            restaurantData.description,
            restaurantData.logoUrl || null,
            restaurantData.bannerUrl || null,
            restaurantData.contactEmail || null,
            restaurantData.phoneNumber || null,
            restaurantData.address || null,
            JSON.stringify(restaurantData.cuisine || []),
            restaurantData.priceRange || null,
            restaurantData.rating || null,
            restaurantData.reviewCount || 0,
            restaurantData.isActive ? 1 : 0,
            JSON.stringify(restaurantData.openingHours || []),
            restaurantData.ownerId,
            restaurantData.createdAt,
            restaurantData.updatedAt
        );
        return id;
    },

    getRestaurants(filters = {}) {
        let query = 'SELECT * FROM restaurants WHERE 1=1';
        const params = [];

        if (filters.search) {
            query += ' AND name LIKE ?';
            params.push(`%${filters.search}%`);
        }

        if (filters.cuisine) {
            query += ' AND cuisine LIKE ?';
            params.push(`%"${filters.cuisine}"%`);
        }

        // Support basic location filter by city or bounding box in filters
        if (filters.city) {
            query += ' AND address LIKE ?';
            params.push(`%${filters.city}%`);
        }

        if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusMeters) {
            // If restaurants have latitude/longitude, perform a simple distance filter using approximate Haversine
            // This is an approximate filter using bounding box to limit results then post-filter in JS
            const lat = parseFloat(filters.lat);
            const lng = parseFloat(filters.lng);
            const r = parseFloat(filters.radiusMeters);
            // compute bounding box (approx) in degrees (very rough)
            const degLat = r / 111320; // meters per degree latitude
            const degLng = r / (111320 * Math.cos(lat * Math.PI / 180) || 1);
            const minLat = lat - degLat;
            const maxLat = lat + degLat;
            const minLng = lng - degLng;
            const maxLng = lng + degLng;
            query += ' AND latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
            params.push(minLat, maxLat, minLng, maxLng);
        }

        if (filters.isActive !== undefined) {
            query += ' AND isActive = ?';
            params.push(filters.isActive ? 1 : 0);
        }

        query += ' ORDER BY createdAt DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        if (filters.offset) {
            query += ' OFFSET ?';
            params.push(filters.offset);
        }

        const stmt = db.prepare(query);
        return stmt.all(...params);
    },

    getRestaurantById(id) {
        const stmt = db.prepare('SELECT * FROM restaurants WHERE id = ?');
        return stmt.get(id);
    },
    getRestaurantByOwnerId(ownerId) {
        const stmt = db.prepare('SELECT * FROM restaurants WHERE ownerId = ? LIMIT 1');
        return stmt.get(ownerId);
    },

    /**
     * Find eateries by location filters (city, lat/lng + radiusMeters)
     * For MVP this supports city-based search or simple lat/lng radius using stored restaurant latitude/longitude.
     */
    getRestaurantsByLocation(filters = {}) {
        // Reuse getRestaurants but pass location filters
        return this.getRestaurants(filters);
    },

    updateRestaurant(id, updates) {
        const fields = Object.keys(updates).filter(k => k !== 'id');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => {
            if (f === 'cuisine' || f === 'openingHours') return JSON.stringify(updates[f]);
            if (f === 'isActive') return updates[f] ? 1 : 0;
            return updates[f];
        });

        const stmt = db.prepare(`UPDATE restaurants SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
    },

    // Menu item operations
    createMenuItem(menuItemData) {
        const id = generateId();
        const stmt = db.prepare(`
      INSERT INTO menu_items (id, restaurantId, name, description, price, category, imageUrl, imageHint, isAvailable, isVegetarian, isVegan, allergens, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            id,
            menuItemData.restaurantId,
            menuItemData.name,
            menuItemData.description || '',
            menuItemData.price,
            menuItemData.category,
            menuItemData.imageUrl || null,
            menuItemData.imageHint || null,
            menuItemData.isAvailable ? 1 : 0,
            menuItemData.isVegetarian ? 1 : 0,
            menuItemData.isVegan ? 1 : 0,
            JSON.stringify(menuItemData.allergens || []),
            menuItemData.createdAt,
            menuItemData.updatedAt
        );
        return id;
    },

    getMenuItemsByRestaurantId(restaurantId) {
        const stmt = db.prepare('SELECT * FROM menu_items WHERE restaurantId = ?');
        return stmt.all(restaurantId);
    },

    getMenuItemById(id) {
        const stmt = db.prepare('SELECT * FROM menu_items WHERE id = ?');
        return stmt.get(id);
    },

    updateMenuItem(id, updates) {
        const fields = Object.keys(updates).filter(k => k !== 'id');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => {
            if (f === 'allergens') return JSON.stringify(updates[f]);
            if (f === 'isAvailable' || f === 'isVegetarian' || f === 'isVegan') return updates[f] ? 1 : 0;
            return updates[f];
        });

        const stmt = db.prepare(`UPDATE menu_items SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
    },

    deleteMenuItem(id) {
        const stmt = db.prepare('DELETE FROM menu_items WHERE id = ?');
        stmt.run(id);
    },

    // Menu category operations
    createMenuCategory(categoryData) {
        const id = generateId();
        const stmt = db.prepare(`
      INSERT INTO menu_categories (id, restaurantId, name, description, displayOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            id,
            categoryData.restaurantId,
            categoryData.name,
            categoryData.description || '',
            categoryData.displayOrder || 0,
            categoryData.createdAt,
            categoryData.updatedAt
        );
        return id;
    },

    getMenuCategoriesByRestaurantId(restaurantId) {
        const stmt = db.prepare('SELECT * FROM menu_categories WHERE restaurantId = ? ORDER BY displayOrder ASC');
        return stmt.all(restaurantId);
    },

    getMenuCategoryById(id) {
        const stmt = db.prepare('SELECT * FROM menu_categories WHERE id = ?');
        return stmt.get(id);
    },

    updateMenuCategory(id, updates) {
        const fields = Object.keys(updates).filter(k => k !== 'id');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => updates[f]);

        const stmt = db.prepare(`UPDATE menu_categories SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
    },

    deleteMenuCategory(id) {
        const stmt = db.prepare('DELETE FROM menu_categories WHERE id = ?');
        stmt.run(id);
    },

    // Order operations
    createOrder(orderData) {
        const id = generateId();
        const stmt = db.prepare(`
      INSERT INTO orders (id, orderId, userId, restaurant, orderItems, orderAmount, paidAmount, paymentMethod, orderStatus, orderDate, expectedTime, isPickedUp, deliveryCharges, tipping, taxationAmount, address, instructions, couponCode, statusHistory, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            id,
            orderData.orderId,
            orderData.userId,
            orderData.restaurant,
            JSON.stringify(orderData.orderItems),
            orderData.orderAmount,
            orderData.paidAmount,
            orderData.paymentMethod,
            orderData.orderStatus,
            orderData.orderDate,
            orderData.expectedTime || null,
            orderData.isPickedUp ? 1 : 0,
            orderData.deliveryCharges || 0,
            orderData.tipping || 0,
            orderData.taxationAmount || 0,
            orderData.address || null,
            orderData.instructions || null,
            orderData.couponCode || null,
            JSON.stringify(orderData.statusHistory),
            orderData.createdAt,
            orderData.updatedAt
        );
        return id;
    },

    getOrdersByUserId(userId) {
        const stmt = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC');
        return stmt.all(userId);
    },

    getOrderById(id) {
        const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
        return stmt.get(id);
    },

    getOrdersByRiderId(riderId) {
        const stmt = db.prepare('SELECT * FROM orders WHERE riderId = ? ORDER BY createdAt DESC');
        return stmt.all(riderId);
    },

    getAvailableOrders() {
        // Only return orders that are READY (vendor has marked them ready for pickup)
        // and have no rider assigned yet
        const stmt = db.prepare("SELECT * FROM orders WHERE orderStatus = 'READY' AND (riderId IS NULL OR riderId = '') ORDER BY createdAt ASC");
        return stmt.all();
    },

    updateOrder(id, updates) {
        const fields = Object.keys(updates).filter(k => k !== 'id');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => {
            if (f === 'orderItems' || f === 'statusHistory') return JSON.stringify(updates[f]);
            if (f === 'isPickedUp') return updates[f] ? 1 : 0;
            return updates[f];
        });

        const stmt = db.prepare(`UPDATE orders SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
    },
};

module.exports = { db, dbHelpers, generateId };
