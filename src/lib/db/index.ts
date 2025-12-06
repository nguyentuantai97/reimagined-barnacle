import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Tạo thư mục data nếu chưa có
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// SQLite database file path
const dbPath = path.join(dataDir, 'tea-shop.db');

// Khởi tạo SQLite connection
const sqlite = new Database(dbPath);

// Bật WAL mode để tối ưu performance
sqlite.pragma('journal_mode = WAL');

// Khởi tạo Drizzle ORM
export const db = drizzle(sqlite, { schema });

// Export schema để sử dụng ở nơi khác
export { schema };
