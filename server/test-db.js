import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT) || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'agriqueue';

console.log('\n======================================================');
console.log('       AgriQueue MySQL Connectivity Diagnostic        ');
console.log('======================================================');
console.log(`Connecting to: ${host}:${port}`);
console.log(`User:          ${user}`);
console.log(`Target DB:     ${database}`);

if (password === 'your_mysql_password_here') {
  console.log('\n⚠️  [NOTICE]: DB_PASSWORD in server/.env is currently the placeholder:');
  console.log('    "your_mysql_password_here"');
  console.log('    Please open server/.env and replace it with your actual MySQL root password.\n');
}

async function runDiagnostic() {
  let connection;
  try {
    // Step 1: Connect to server without database to verify credentials & reachability
    console.log('Step 1: Connecting to MySQL instance...');
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
    });
    console.log('✅ Step 1 SUCCESS: Authenticated successfully with MySQL Server!');

    // Step 2: Ensure the target database exists
    console.log(`\nStep 2: Ensuring database '${database}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Step 2 SUCCESS: Database '${database}' is ready!`);

    // Step 3: Switch to database and run quick query
    console.log(`\nStep 3: Verifying query execution inside '${database}'...`);
    await connection.query(`USE \`${database}\`;`);
    const [rows] = await connection.query('SELECT 1 + 1 AS testCalculation, VERSION() AS mysqlVersion, NOW() AS serverTime;');

    console.log('✅ Step 3 SUCCESS: Query executed successfully!');
    console.log('\n--- MySQL Server Details ---');
    console.log(`Version:     ${rows[0]?.mysqlVersion}`);
    console.log(`Server Time: ${rows[0]?.serverTime}`);
    console.log(`Calculation: 1 + 1 = ${rows[0]?.testCalculation}`);
    console.log('----------------------------\n');
    console.log('🎉 All checks passed! Your Express server is ready to use MySQL.\n');

  } catch (err) {
    console.error('\n❌ Connection check failed:');
    console.error(`   Error Code: ${err.code}`);
    console.error(`   Message:    ${err.message}\n`);

    if (err.code === 'ECONNREFUSED') {
      console.log('👉 Troubleshooting Guide:');
      console.log('   - The MySQL Server does not seem to be running on 127.0.0.1:3306.');
      console.log('   - Please start the MySQL service in Windows Services (services.msc) or via XAMPP / MySQL Workbench.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('👉 Troubleshooting Guide:');
      console.log("   - Access was denied for user 'root'.");
      console.log('   - Please open server/.env and check that DB_PASSWORD matches your local MySQL root password.');
    } else if (err.code === 'ENOTFOUND') {
      console.log('👉 Troubleshooting Guide:');
      console.log(`   - Could not resolve host '${host}'. Try using '127.0.0.1' or 'localhost'.`);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runDiagnostic();
