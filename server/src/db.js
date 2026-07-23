// 连接 postgresql 数据库
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const db = new Pool({
  connectionString: process.env.DB_URL,
});

module.exports = db;