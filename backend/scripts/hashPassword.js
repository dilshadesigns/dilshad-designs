/**
 * scripts/hashPassword.js
 *
 * Run this ONCE to generate a bcrypt hash for your admin password.
 * Copy the output into your .env as ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/hashPassword.js
 *   node scripts/hashPassword.js "MyStr0ngP@ss!"
 */

'use strict';

const bcrypt = require('bcryptjs');

const COST_FACTOR = 12; // higher = slower = more secure

async function main() {
  const plainPassword = process.argv[2] || promptPassword();

  if (!plainPassword || plainPassword.trim().length < 8) {
    console.error('❌  Password must be at least 8 characters.');
    process.exit(1);
  }

  console.log('\n⏳  Hashing password (cost factor:', COST_FACTOR, ')...\n');
  const hash = await bcrypt.hash(plainPassword.trim(), COST_FACTOR);

  console.log('✅  Bcrypt hash generated:\n');
  console.log('   ' + hash);
  console.log('\n📋  Add this to your .env file:\n');
  console.log('   ADMIN_PASSWORD_HASH=' + hash);
  console.log('');
}

function promptPassword() {
  // Simple synchronous stdin read when no arg is supplied
  const { execSync } = require('child_process');
  try {
    // Works on Linux/macOS
    const result = execSync(
      'read -s -p "Enter admin password: " pw && echo "$pw"',
      { shell: '/bin/bash' }
    ).toString().trim();
    console.log(''); // newline after hidden input
    return result;
  } catch {
    console.error('Please pass the password as an argument:');
    console.error('  node scripts/hashPassword.js "YourPassword"');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});