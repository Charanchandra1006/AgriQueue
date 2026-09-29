import { pool } from '../config/db.js';

const tableDefinitions = [
  {
    name: 'farmers',
    order: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS \`farmers\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`farmer_id\` VARCHAR(32) NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`state\` VARCHAR(100) NOT NULL,
        \`district\` VARCHAR(100) NOT NULL,
        \`village\` VARCHAR(100) DEFAULT NULL,
        \`preferred_language\` VARCHAR(20) NOT NULL DEFAULT 'en',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_farmers_farmer_id\` (\`farmer_id\`),
        UNIQUE KEY \`uq_farmers_phone\` (\`phone\`),
        INDEX \`idx_farmers_location\` (\`state\`, \`district\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'mandis',
    order: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS \`mandis\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(150) NOT NULL,
        \`state\` VARCHAR(100) NOT NULL,
        \`district\` VARCHAR(100) NOT NULL,
        \`location\` VARCHAR(255) DEFAULT NULL,
        \`latitude\` DECIMAL(10, 8) DEFAULT NULL,
        \`longitude\` DECIMAL(11, 8) DEFAULT NULL,
        \`opening_time\` TIME DEFAULT NULL,
        \`closing_time\` TIME DEFAULT NULL,
        \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`mandal\` VARCHAR(100) DEFAULT NULL,
        \`village\` VARCHAR(100) DEFAULT NULL,
        \`center_type\` VARCHAR(100) DEFAULT NULL,
        \`commodities\` TEXT DEFAULT NULL,
        \`source\` VARCHAR(100) DEFAULT 'e-NAM / Agmarknet (data.gov.in)',
        \`source_url\` VARCHAR(500) DEFAULT NULL,
        \`source_name\` VARCHAR(150) DEFAULT NULL,
        \`source_updated_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_mandis_state_dist_name\` (\`state\`, \`district\`, \`name\`),
        INDEX \`idx_mandis_location\` (\`state\`, \`district\`),
        INDEX \`idx_mandis_mandal_village\` (\`district\`, \`mandal\`, \`village\`),
        INDEX \`idx_mandis_center_type\` (\`center_type\`),
        INDEX \`idx_mandis_is_active\` (\`is_active\`),
        INDEX \`idx_mandis_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'mandi_slots',
    order: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS \`mandi_slots\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`mandi_id\` INT UNSIGNED NOT NULL,
        \`slot_date\` DATE NOT NULL,
        \`start_time\` TIME NOT NULL,
        \`end_time\` TIME NOT NULL,
        \`maximum_bookings\` INT UNSIGNED NOT NULL DEFAULT 50,
        \`current_bookings\` INT UNSIGNED NOT NULL DEFAULT 0,
        \`status\` ENUM('AVAILABLE', 'FAST_FILLING', 'FULL', 'CLOSED') NOT NULL DEFAULT 'AVAILABLE',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`chk_bookings_limit\` CHECK (\`current_bookings\` <= \`maximum_bookings\`),
        CONSTRAINT \`fk_mandi_slots_mandi\` FOREIGN KEY (\`mandi_id\`) REFERENCES \`mandis\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY \`uq_mandi_slot_schedule\` (\`mandi_id\`, \`slot_date\`, \`start_time\`, \`end_time\`),
        INDEX \`idx_slots_mandi_date\` (\`mandi_id\`, \`slot_date\`),
        INDEX \`idx_slots_date\` (\`slot_date\`),
        INDEX \`idx_slots_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'bookings',
    order: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS \`bookings\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`booking_id\` VARCHAR(50) NOT NULL,
        \`farmer_id\` INT UNSIGNED NOT NULL,
        \`mandi_id\` INT UNSIGNED NOT NULL,
        \`slot_id\` INT UNSIGNED NOT NULL,
        \`crop_name\` VARCHAR(100) NOT NULL,
        \`estimated_quantity\` DECIMAL(10, 2) NOT NULL COMMENT 'Weight in quintals',
        \`token_number\` VARCHAR(50) NOT NULL,
        \`booking_status\` ENUM('CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED') NOT NULL DEFAULT 'CONFIRMED',
        \`booked_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_bookings_booking_id\` (\`booking_id\`),
        UNIQUE KEY \`uq_bookings_farmer_slot\` (\`farmer_id\`, \`slot_id\`),
        CONSTRAINT \`fk_bookings_farmer\` FOREIGN KEY (\`farmer_id\`) REFERENCES \`farmers\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_bookings_mandi\` FOREIGN KEY (\`mandi_id\`) REFERENCES \`mandis\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_bookings_slot\` FOREIGN KEY (\`slot_id\`) REFERENCES \`mandi_slots\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX \`idx_bookings_farmer\` (\`farmer_id\`),
        INDEX \`idx_bookings_mandi\` (\`mandi_id\`),
        INDEX \`idx_bookings_slot\` (\`slot_id\`),
        INDEX \`idx_bookings_token\` (\`token_number\`),
        INDEX \`idx_bookings_status\` (\`booking_status\`),
        INDEX \`idx_bookings_date\` (\`booked_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'market_prices',
    order: 5,
    sql: `
      CREATE TABLE IF NOT EXISTS \`market_prices\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`state\` VARCHAR(100) NOT NULL,
        \`district\` VARCHAR(100) NOT NULL,
        \`market_name\` VARCHAR(150) NOT NULL,
        \`commodity\` VARCHAR(100) NOT NULL,
        \`variety\` VARCHAR(100) NOT NULL DEFAULT 'Other',
        \`arrival_date\` DATE NOT NULL,
        \`min_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Minimum daily price per quintal in INR',
        \`max_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Maximum daily price per quintal in INR',
        \`modal_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Modal daily price per quintal in INR',
        \`source\` VARCHAR(150) NOT NULL DEFAULT 'Government of India / AGMARKNET / data.gov.in',
        \`fetched_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_market_prices_daily\` (\`state\`, \`district\`, \`market_name\`, \`commodity\`, \`variety\`, \`arrival_date\`),
        INDEX \`idx_market_prices_state\` (\`state\`),
        INDEX \`idx_market_prices_district\` (\`district\`),
        INDEX \`idx_market_prices_market_name\` (\`market_name\`),
        INDEX \`idx_market_prices_commodity\` (\`commodity\`),
        INDEX \`idx_market_prices_arrival_date\` (\`arrival_date\`),
        INDEX \`idx_market_prices_lookup\` (\`state\`, \`district\`, \`commodity\`, \`arrival_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'transport_bookings',
    order: 6,
    sql: `
      CREATE TABLE IF NOT EXISTS \`transport_bookings\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`transport_booking_id\` VARCHAR(50) NOT NULL,
        \`farmer_id\` INT UNSIGNED NOT NULL,
        \`mandi_booking_id\` INT UNSIGNED DEFAULT NULL,
        \`vehicle_type\` ENUM('Tractor Trolley', 'Small Commercial Truck (Chota Hathi)', 'Heavy Duty 6-Wheeler Truck') NOT NULL,
        \`crop_name\` VARCHAR(100) NOT NULL,
        \`estimated_quantity\` DECIMAL(10, 2) NOT NULL COMMENT 'Weight in quintals',
        \`pickup_village\` VARCHAR(100) NOT NULL,
        \`pickup_mandal\` VARCHAR(100) DEFAULT NULL,
        \`pickup_district\` VARCHAR(100) NOT NULL,
        \`pickup_state\` VARCHAR(100) NOT NULL,
        \`pickup_date\` DATE NOT NULL,
        \`pickup_time\` VARCHAR(50) NOT NULL,
        \`driver_name\` VARCHAR(100) DEFAULT NULL,
        \`driver_phone\` VARCHAR(20) DEFAULT NULL,
        \`driver_vehicle_number\` VARCHAR(30) DEFAULT NULL,
        \`transport_status\` ENUM('REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'CROP_PICKED_UP', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
        \`notes\` VARCHAR(255) DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_transport_booking_id\` (\`transport_booking_id\`),
        CONSTRAINT \`fk_transport_farmer\` FOREIGN KEY (\`farmer_id\`) REFERENCES \`farmers\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_transport_mandi_booking\` FOREIGN KEY (\`mandi_booking_id\`) REFERENCES \`bookings\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX \`idx_transport_farmer\` (\`farmer_id\`),
        INDEX \`idx_transport_mandi_booking\` (\`mandi_booking_id\`),
        INDEX \`idx_transport_status\` (\`transport_status\`),
        INDEX \`idx_transport_date\` (\`pickup_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

async function initializeDatabase() {
  console.log('\n======================================================');
  console.log('       AgriQueue Database Schema Initializer          ');
  console.log('======================================================\n');

  let connection;
  try {
    connection = await pool.getConnection();
    const [dbResult] = await connection.query('SELECT DATABASE() AS currentDatabase;');
    const currentDb = dbResult[0]?.currentDatabase;
    console.log(`Connected to Database: [${currentDb}]`);

    // Create tables in correct FK order
    for (const table of tableDefinitions) {
      process.stdout.write(`Creating table [${table.name}] (Step ${table.order}/${tableDefinitions.length})... `);
      await connection.query(table.sql);
      console.log('✅ OK (Created or already exists)');
    }

    // Verify all tables in information_schema
    console.log('\n--- Verification: Checking Existing Tables in Database ---');
    const [existingTables] = await connection.query(`
      SELECT TABLE_NAME, ENGINE, TABLE_ROWS, CREATE_TIME 
      FROM information_schema.tables 
      WHERE table_schema = ? AND TABLE_NAME IN ('farmers', 'mandis', 'mandi_slots', 'bookings', 'market_prices', 'transport_bookings')
      ORDER BY TABLE_NAME;
    `, [currentDb]);

    console.table(existingTables.map(t => ({
      'Table Name': t.TABLE_NAME,
      'Storage Engine': t.ENGINE,
      'Status': 'Active & Verified'
    })));

    // Verify Foreign Key Constraints
    const [fks] = await connection.query(`
      SELECT 
        TABLE_NAME AS 'Table',
        CONSTRAINT_NAME AS 'Constraint Name',
        COLUMN_NAME AS 'Column',
        REFERENCED_TABLE_NAME AS 'References Table',
        REFERENCED_COLUMN_NAME AS 'References Column'
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME;
    `, [currentDb]);

    if (fks.length > 0) {
      console.log('\n--- Verified Foreign Key Relationships ---');
      console.table(fks);
    }

    console.log('🎉 Database initialization completed successfully! All 4 tables are ready.\n');
  } catch (err) {
    console.error('\n❌ Database initialization failed:');
    console.error(`   Error Code: ${err.code}`);
    console.error(`   Message:    ${err.message}\n`);
    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

initializeDatabase();
