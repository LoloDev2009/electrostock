const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

function setCookieSesion(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TREINTA_DIAS_MS,
  });
}

router.post('/login', async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Falta la contraseña' });

  if (!process.env.APP_PASSWORD_HASH || !process.env.JWT_SECRET) {
    console.error('Faltan APP_PASSWORD_HASH o JWT_SECRET en las variables de entorno.');
    return res.status(500).json({ error: 'El servidor no tiene configurado el login' });
  }

  const valido = await bcrypt.compare(password, process.env.APP_PASSWORD_HASH);
  if (!valido) return res.status(401).json({ error: 'Contraseña incorrecta' });

  const token = jwt.sign({ ok: true }, process.env.JWT_SECRET, { expiresIn: '30d' });
  setCookieSesion(res, token);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/status', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ authenticated: false });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

module.exports = router;
