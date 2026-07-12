const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Supabase (y la mayoría de los Postgres administrados) exigen SSL.
// Se detecta automáticamente por el host, o se puede forzar con DB_SSL=true.
const necesitaSSL =
  process.env.DB_SSL === 'true' ||
  /supabase\.(co|com)/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: necesitaSSL ? { rejectUnauthorized: false } : false,
  // Alternativa si no usas DATABASE_URL:
  // host: process.env.PGHOST,
  // port: process.env.PGPORT,
  // user: process.env.PGUSER,
  // password: process.env.PGPASSWORD,
  // database: process.env.PGDATABASE,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
