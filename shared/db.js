const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Alternativa si no usas DATABASE_URL:
  // host: process.env.PGHOST,
  // port: process.env.PGPORT,
  // user: process.env.PGUSER,
  // password: process.env.PGPASSWORD,
  // database: process.env.PGDATABASE,
});

pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  } else {
    console.log('Conexión a la base de datos establecida correctamente.');
  }
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
