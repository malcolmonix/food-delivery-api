/**
 * Database Module with Automatic Fallback
 * Attempts to use Supabase, falls back to memory database on connection failure
 */

let dbHelpers;
let usingFallback = false;
let connectionError = null;

/**
 * Initialize database with automatic fallback
 */
async function initializeDatabase() {
    // Check if Supabase credentials are available
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
        try {
            console.log('🔍 Attempting to connect to Supabase...');
            
            // Import Supabase helpers
            const { dbHelpers: supabaseHelpers } = require('./database.supabase');
            
            // Test connection with a simple query (with timeout)
            const testPromise = supabaseHelpers.getStatistics();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            );
            
            await Promise.race([testPromise, timeoutPromise]);
            
            // Connection successful
            dbHelpers = supabaseHelpers;
            usingFallback = false;
            connectionError = null;
            console.log('✅ Connected to Supabase database');
            
        } catch (error) {
            console.error('❌ Supabase connection failed:', error.message);
            console.log('⚠️ Falling back to in-memory database with sample data');
            
            // Fall back to memory database
            const { dbHelpers: memoryHelpers } = require('./database.memory');
            dbHelpers = memoryHelpers;
            usingFallback = true;
            connectionError = error.message;
        }
    } else {
        console.log('🧠 No Supabase credentials found, using in-memory database');
        
        // Use memory database
        const { dbHelpers: memoryHelpers } = require('./database.memory');
        dbHelpers = memoryHelpers;
        usingFallback = true;
        connectionError = 'No Supabase credentials configured';
    }
    
    return dbHelpers;
}

/**
 * Get database helpers (initialize if needed)
 */
async function getDbHelpers() {
    if (!dbHelpers) {
        await initializeDatabase();
    }
    return dbHelpers;
}

/**
 * Check if using fallback database
 */
function isUsingFallback() {
    return usingFallback;
}

/**
 * Get connection error (if any)
 */
function getConnectionError() {
    return connectionError;
}

/**
 * Get database status
 */
function getDatabaseStatus() {
    return {
        connected: !usingFallback,
        usingFallback,
        connectionError,
        databaseType: usingFallback ? 'memory' : 'supabase'
    };
}

/**
 * Retry connection to Supabase
 */
async function retryConnection() {
    console.log('🔄 Retrying Supabase connection...');
    
    // Reset state
    dbHelpers = null;
    usingFallback = false;
    connectionError = null;
    
    // Reinitialize
    return await initializeDatabase();
}

module.exports = {
    initializeDatabase,
    getDbHelpers,
    isUsingFallback,
    getConnectionError,
    getDatabaseStatus,
    retryConnection
};
