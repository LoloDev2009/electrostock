const pool = require('./db');

const CAMPOS = [
  'name', 'category', 'subcategory', 'value_spec', 'voltage', 'tolerance',
  'package_type', 'quantity', 'min_quantity', 'location', 'manufacturer',
  'part_number', 'datasheet_url', 'notes',
];

async function listar({ category, search, lowStock, limit = 100, offset = 0 } = {}) {
  const condiciones = [];
  const valores = [];
  let i = 1;

  if (category) {
    condiciones.push(`category = $${i++}`);
    valores.push(category);
  }
  if (search) {
    condiciones.push(`(name ILIKE $${i} OR part_number ILIKE $${i} OR value_spec ILIKE $${i})`);
    valores.push(`%${search}%`);
    i++;
  }
  if (lowStock) {
    condiciones.push(`quantity <= min_quantity`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  valores.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT * FROM components ${where} ORDER BY category, name LIMIT $${i++} OFFSET $${i}`,
    valores
  );
  return rows;
}

async function obtenerPorId(id) {
  const { rows } = await pool.query('SELECT * FROM components WHERE id = $1', [id]);
  return rows[0] || null;
}

async function crear(datos) {
  const campos = CAMPOS.filter((c) => datos[c] !== undefined);
  const placeholders = campos.map((_, idx) => `$${idx + 1}`);
  const valores = campos.map((c) => datos[c]);

  const { rows } = await pool.query(
    `INSERT INTO components (${campos.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    valores
  );
  return rows[0];
}

async function actualizar(id, datos) {
  const campos = CAMPOS.filter((c) => datos[c] !== undefined);
  if (campos.length === 0) return obtenerPorId(id);

  const sets = campos.map((c, idx) => `${c} = $${idx + 1}`);
  const valores = campos.map((c) => datos[c]);
  valores.push(id);

  const { rows } = await pool.query(
    `UPDATE components SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING *`,
    valores
  );
  return rows[0] || null;
}

async function ajustarCantidad(id, delta) {
  const { rows } = await pool.query(
    `UPDATE components SET quantity = GREATEST(quantity + $1, 0) WHERE id = $2 RETURNING *`,
    [delta, id]
  );
  return rows[0] || null;
}

async function eliminar(id) {
  const { rows } = await pool.query('DELETE FROM components WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
}

async function categorias() {
  const { rows } = await pool.query(
    'SELECT category, COUNT(*)::int AS total FROM components GROUP BY category ORDER BY category'
  );
  return rows;
}

async function stockBajo() {
  const { rows } = await pool.query(
    'SELECT * FROM components WHERE quantity <= min_quantity ORDER BY category, name'
  );
  return rows;
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  ajustarCantidad,
  eliminar,
  categorias,
  stockBajo,
};
