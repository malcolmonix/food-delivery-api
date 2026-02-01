/**
 * Database Migration Runner
 * Runs SQL migration files in order
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database:', DB_PATH);
});

// Create migrations tracking table
const createMigrationsTable = () => {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        appliedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Get applied migrations
const getAppliedMigrations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT filename FROM migrations', (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.filename));
    });
  });
};

// Record migration as applied
const recordMigration = (filename) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO migrations (filename) VALUES (?)', [filename], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Run a single migration
const runMigration = async (filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    db.exec(sql, async (err) => {
      if (err) {
        console.error(`Error running migration ${filename}:`, err);
        reject(err);
      } else {
        await recordMigration(filename);
        console.log(`✓ Applied migration: ${filename}`);
        resolve();
      }
    });
  });
};

// Main migration runner
const runMigrations = async () => {
  try {
    console.log('\n🔄 Starting database migrations...\n');
    
    // Create migrations table
    await createMigrationsTable();
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations();
    
    // Run pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ All migrations are up to date.\n');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migration(s):\n`);
    
    for (const filename of pendingMigrations) {
      await runMigration(filename);
    }
    
    console.log(`\n✓ Successfully applied ${pendingMigrations.length} migration(s).\n`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

// Run migrations
runMigrations();
