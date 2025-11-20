// Query the SQLite database and display structure and data
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'food-delivery.db');
const db = new Database(dbPath);

console.log('📊 Database Structure and Data\n');
console.log('='.repeat(80));

// Get all tables
console.log('\n📋 TABLES:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(table => console.log(`  - ${table.name}`));

// Show restaurants table structure
console.log('\n🏪 RESTAURANTS TABLE SCHEMA:');
const restaurantSchema = db.prepare("PRAGMA table_info(restaurants)").all();
console.table(restaurantSchema.map(col => ({
    Column: col.name,
    Type: col.type,
    NotNull: col.notnull ? 'YES' : 'NO',
    Default: col.dflt_value || 'NULL'
})));

// Count restaurants
const restaurantCount = db.prepare("SELECT COUNT(*) as count FROM restaurants").get();
console.log(`\n📈 Total Restaurants: ${restaurantCount.count}`);

// Show all restaurants
if (restaurantCount.count > 0) {
    console.log('\n🏪 RESTAURANT DATA:');
    const restaurants = db.prepare("SELECT id, name, description, ownerId, logoUrl, bannerUrl, contactEmail, isActive FROM restaurants").all();
    console.table(restaurants.map(r => ({
        ID: r.id.substring(0, 15) + '...',
        Name: r.name,
        Description: r.description.substring(0, 30) + '...',
        Owner: r.ownerId.substring(0, 15) + '...',
        Logo: r.logoUrl ? '✓' : '✗',
        Banner: r.bannerUrl ? '✓' : '✗',
        Email: r.contactEmail,
        Active: r.isActive ? '✓' : '✗'
    })));
}

// Show users table structure
console.log('\n👤 USERS TABLE SCHEMA:');
const userSchema = db.prepare("PRAGMA table_info(users)").all();
console.table(userSchema.map(col => ({
    Column: col.name,
    Type: col.type,
    NotNull: col.notnull ? 'YES' : 'NO'
})));

// Count users
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
console.log(`\n📈 Total Users: ${userCount.count}`);

// Show users (without passwords)
if (userCount.count > 0) {
    console.log('\n👤 USER DATA:');
    const users = db.prepare("SELECT id, uid, email, displayName, phoneNumber FROM users LIMIT 10").all();
    console.table(users.map(u => ({
        UID: u.uid.substring(0, 20) + '...',
        Email: u.email,
        Name: u.displayName || '(none)',
        Phone: u.phoneNumber || '(none)'
    })));
}

// Show menu items count
const menuItemCount = db.prepare("SELECT COUNT(*) as count FROM menu_items").get();
console.log(`\n🍽️ Total Menu Items: ${menuItemCount.count}`);

// Show orders count
const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get();
console.log(`\n📦 Total Orders: ${orderCount.count}`);

console.log('\n' + '='.repeat(80));

db.close();
