/**
 * Mark Migration as Applied
 * Helper script to record a migration as applied without executing it
 */

require('dotenv').config();
const { supabase } = require('./supabase');

const filename = process.argv[2];

if (!filename) {
  console.error('❌ Please provide a migration filename');
  console.error('Usage: node mark-migration-applied.js <filename>');
  process.exit(1);
}

async function markApplied() {
  try {
    console.log(`\n📝 Marking migration as applied: ${filename}\n`);
    
    const { error } = await supabase
      .from('migrations')
      .insert({ filename });

    if (error) {
      if (error.code === '23505') {
        console.log('✓ Migration already marked as applied');
      } else {
        throw error;
      }
    } else {
      console.log('✓ Migration marked as applied successfully');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

markApplied();
