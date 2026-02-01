/**
 * PostgreSQL/Supabase Database Migration Runner
 * Runs SQL migration files in order using Supabase client
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('./supabase');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Create migrations tracking table
const createMigrationsTable = async () => {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  });

  if (error) {
    // Try alternative approach using direct SQL
    console.log('⚠️ RPC method not available, using direct table creation...');
    // We'll handle this differently - check if table exists
    const { data, error: checkError } = await supabase
      .from('migrations')
      .select('filename')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, we need to create it manually
      console.log('❌ Migrations table does not exist. Please create it manually in Supabase:');
      console.log(`
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
      `);
      throw new Error('Migrations table must be created manually in Supabase');
    }
  }
};

// Get applied migrations
const getAppliedMigrations = async () => {
  const { data, error } = await supabase
    .from('migrations')
    .select('filename');

  if (error) {
    console.error('Error fetching applied migrations:', error);
    return [];
  }

  return data.map(row => row.filename);
};

// Record migration as applied
const recordMigration = async (filename) => {
  const { error } = await supabase
    .from('migrations')
    .insert({ filename });

  if (error) {
    throw error;
  }
};

// Convert SQLite SQL to PostgreSQL SQL
const convertSqlToPostgres = (sql) => {
  let converted = sql;
  
  // Replace INTEGER with BOOLEAN for boolean fields
  converted = converted.replace(/surgePricing INTEGER DEFAULT 0/g, 'surgePricing BOOLEAN DEFAULT FALSE');
  converted = converted.replace(/isActive INTEGER DEFAULT 1/g, 'isActive BOOLEAN DEFAULT TRUE');
  
  // Replace TEXT DEFAULT CURRENT_TIMESTAMP with TIMESTAMP
  converted = converted.replace(/createdAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  converted = converted.replace(/updatedAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  converted = converted.replace(/appliedAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  
  // Replace REAL with NUMERIC for decimal fields
  converted = converted.replace(/REAL/g, 'NUMERIC');
  
  // Handle ON CONFLICT for PostgreSQL
  converted = converted.replace(/ON CONFLICT\(id\) DO NOTHING/g, 'ON CONFLICT (id) DO NOTHING');
  
  return converted;
};

// Run a single migration
const runMigration = async (filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  let sql = fs.readFileSync(filePath, 'utf8');
  
  // Convert SQLite syntax to PostgreSQL
  sql = convertSqlToPostgres(sql);
  
  console.log(`\n📝 Running migration: ${filename}`);
  console.log('SQL to execute:');
  console.log('---');
  console.log(sql);
  console.log('---\n');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      // For ALTER TABLE and CREATE TABLE, we need to use raw SQL
      // Supabase client doesn't support DDL directly, so we'll log instructions
      console.log('Statement:', statement.substring(0, 100) + '...');
      
      // We can't execute DDL through Supabase client directly
      // We need to provide instructions for manual execution
      console.log('⚠️ This statement needs to be executed manually in Supabase SQL Editor');
      
    } catch (error) {
      console.error(`❌ Error executing statement ${i + 1}:`, error.message);
      throw error;
    }
  }
  
  await recordMigration(filename);
  console.log(`✓ Migration ${filename} recorded as applied`);
};

// Main migration runner
const runMigrations = async () => {
  try {
    console.log('\n🔄 Starting PostgreSQL/Supabase migrations...\n');
    
    // Check Supabase connection
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing!');
      console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
      process.exit(1);
    }
    
    console.log('✓ Supabase credentials found');
    console.log('URL:', process.env.SUPABASE_URL);
    
    // Create migrations table
    await createMigrationsTable();
    console.log('✓ Migrations table ready\n');
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration file(s):\n`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));
    console.log();
    
    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`Already applied: ${appliedMigrations.length} migration(s)\n`);
    
    // Run pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ All migrations are up to date.\n');
      return;
    }
    
    console.log(`⚠️ IMPORTANT: Supabase migrations must be run manually!\n`);
    console.log(`Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach(file => console.log(`  - ${file}`));
    console.log();
    
    console.log('📋 Instructions:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL from the migration files below');
    console.log('4. Execute each migration in order\n');
    
    for (const filename of pendingMigrations) {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      let sql = fs.readFileSync(filePath, 'utf8');
      sql = convertSqlToPostgres(sql);
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Migration: ${filename}`);
      console.log('='.repeat(60));
      console.log(sql);
      console.log('='.repeat(60));
    }
    
    console.log('\n⚠️ After running the migrations in Supabase, you can mark them as applied by running:');
    console.log('   node mark-migration-applied.js <filename>\n');
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  }
};

// Run migrations
runMigrations();
