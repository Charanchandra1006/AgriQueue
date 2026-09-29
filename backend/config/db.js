import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agriqueue',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
};

// Create asynchronous connection pool
export const pool = mysql.createPool(dbConfig);

/**
 * Validates the database connection by executing a quick query.
 * @returns {Promise<{ success: boolean, message: string, serverInfo?: object }>}
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT 1 + 1 AS testResult, VERSION() AS mysqlVersion, CURRENT_TIMESTAMP() AS dbTime');
      return {
        success: true,
        message: 'Connected to MySQL server successfully',
        serverInfo: {
          version: rows[0]?.mysqlVersion,
          dbTime: rows[0]?.dbTime,
          database: dbConfig.database,
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user
        }
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
      code: error.code,
      errno: error.errno
    };
  }
};
