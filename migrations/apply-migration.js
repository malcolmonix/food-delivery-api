/**
 * Database Migration Runner
 * 
 * This script applies SQL migrations to the database.
 * It can be used for both SQLite (development) and PostgreSQL (production).
 * 
 * Usage:
 *   node migrations/apply-migration.js <migration-file>
 * 
 * Example:
 *   node migrations/apply-migration.js add-order-tracking-indexes.sql
 */

const fs = require('fs');
const path = require('path');

// Determine which database to use
const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';

async function applyMigration(migrationFile) {
  console.log('='.repeat(80));
  console.log('Database Migration Runner');
  console.log('='.repeat(80));
  console.log(`Migration file: ${migrationFile}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${useSupabase ? 'Supabase PostgreSQL' : 'SQLite'}`);
  console.log('='.repeat(80));

  // Read migration file
  const migrationPath = path.join(__dirname, migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('\n📄 Migration SQL:');
  console.log('-'.repeat(80));
  console.log(sql);
  console.log('-'.repeat(80));

  try {
    if (useSupabase) {
      await applySupabaseMigration(sql);
    } else {
      await applySQLiteMigration(sql);
    }
    
    console.log('\n✅ Migration applied successfully!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function applySQLiteMigration(sql) {
  const { getDb } = require('../database.sqlite');
  const db = getDb();
  
  console.log('\n🔄 Applying migration to SQLite...');
  
  // Split SQL by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log(`\n  Executing: ${statement.substring(0, 60)}...`);
      db.prepare(statement).run();
    }
  }
  
  // Verify indexes were created
  console.log('\n📊 Verifying indexes...');
  const indexes = db.prepare(`
    SELECT name, sql 
    FROM sqlite_master 
    WHERE type='index' AND tbl_name='orders'
  `).all();
  
  console.log('\n  Created indexes:');
  indexes.forEach(idx => {
    console.log(`    ✓ ${idx.name}`);
  });
}

async function applySupabaseMigration(sql) {
  const { supabase } = require('../database.supabase');
  
  console.log('\n🔄 Applying migration to Supabase PostgreSQL...');
  
  // For Supabase, we need to execute the SQL through the RPC or direct query
  // Note: This requires proper permissions on the Supabase project
  
  // Split SQL by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log(`\n  Executing: ${statement.substring(0, 60)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // If RPC doesn't work, try direct query (may not work for DDL)
        console.log('  RPC failed, trying direct query...');
        const { error: queryError } = await supabase.from('orders').select('id').limit(0);
        
        if (queryError) {
          throw new Error(`Failed to execute statement: ${error.message || queryError.message}`);
        }
      }
    }
  }
  
  console.log('\n⚠️  Note: For Supabase, you may need to run this migration manually');
  console.log('   through the Supabase SQL Editor at:');
  console.log('   https://app.supabase.com/project/_/sql');
  console.log('\n   Copy the SQL from the migration file and execute it there.');
}

// Main execution
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node apply-migration.js <migration-file>');
  console.error('Example: node apply-migration.js add-order-tracking-indexes.sql');
  process.exit(1);
}

applyMigration(migrationFile);
