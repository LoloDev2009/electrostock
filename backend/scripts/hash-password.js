// Genera el hash que va en APP_PASSWORD_HASH (.env)
// Uso: node scripts/hash-password.js "miContraseñaSegura"
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash-password.js "tu-contraseña"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nAgregá esto a tu .env:\n');
  console.log(`APP_PASSWORD_HASH=${hash}\n`);
});
