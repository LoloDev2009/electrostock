const express = require('express');
const router = express.Router();
const svc = require('../shared/componentsService');

// GET /api/components?category=&search=&lowStock=true
router.get('/', async (req, res) => {
  try {
    const { category, search, lowStock } = req.query;
    const items = await svc.listar({ category, search, lowStock: lowStock === 'true' });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar componentes' });
  }
});

router.get('/categorias', async (req, res) => {
  try {
    res.json(await svc.categorias());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

router.get('/stock-bajo', async (req, res) => {
  try {
    res.json(await svc.stockBajo());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener stock bajo' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await svc.obtenerPorId(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener componente' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.name || !req.body.category) {
      return res.status(400).json({ error: 'name y category son obligatorios' });
    }
    const nuevo = await svc.crear(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear componente' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const actualizado = await svc.actualizar(req.params.id, req.body);
    if (!actualizado) return res.status(404).json({ error: 'No encontrado' });
    res.json(actualizado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar componente' });
  }
});

router.patch('/:id/cantidad', async (req, res) => {
  try {
    const delta = Number(req.body.delta);
    if (Number.isNaN(delta)) return res.status(400).json({ error: 'delta debe ser numérico' });
    const actualizado = await svc.ajustarCantidad(req.params.id, delta);
    if (!actualizado) return res.status(404).json({ error: 'No encontrado' });
    res.json(actualizado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al ajustar cantidad' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const eliminado = await svc.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar componente' });
  }
});

module.exports = router;
