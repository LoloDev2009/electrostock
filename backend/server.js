const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const componentsRouter = require('./routes/components');
const authRouter = require('./routes/auth');
const requireAuth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);              // pública: login, logout, status
app.use('/api/components', requireAuth, componentsRouter); // requiere sesión

// Sirve la app web (frontend estático)
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
