const API = '/api/components';

const el = (id) => document.getElementById(id);
const grid = el('grid');
const emptyState = el('empty-state');
const searchInput = el('search');
const categoryFilter = el('category-filter');
const lowStockToggle = el('low-stock-toggle');
const overlay = el('overlay');
const drawer = el('drawer');
const form = el('component-form');
const categoryList = el('category-list');
const headerStats = el('header-stats');

let debounceTimer;

async function cargarCategorias() {
  const res = await fetch(`${API}/categorias`);
  const cats = await res.json();

  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map((c) => `<option value="${c.category}">${c.category} (${c.total})</option>`).join('');
  categoryList.innerHTML = cats.map((c) => `<option value="${c.category}">`).join('');

  const totalItems = cats.reduce((sum, c) => sum + c.total, 0);

  const totalComponents = cats.reduce((sum, c) => sum + c.total_components, 0);
  headerStats.innerHTML = `
    <div><b>${totalItems}</b>referencias</div>
    <div><b>${totalComponents}</b>componentes</div>
    <div><b>${cats.length}</b>categorías</div>
  `;
}

async function cargarComponentes() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
  if (categoryFilter.value) params.set('category', categoryFilter.value);
  if (lowStockToggle.checked) params.set('lowStock', 'true');

  const res = await fetch(`${API}?${params.toString()}`);
  const items = await res.json();
  render(items);
}

function render(items) {
  if (items.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  grid.innerHTML = items.map((c) => {
    const low = c.min_quantity > 0 && c.quantity <= c.min_quantity;
    const metaLines = [
      c.value_spec && `spec: ${c.value_spec}`,
      c.package_type && `pkg: ${c.package_type}`,
      c.voltage && `V: ${c.voltage}`,
      c.tolerance && `tol: ${c.tolerance}`,
      c.location && `📍 ${c.location}`,
    ].filter(Boolean).join('<br>');

    return `
      <div class="card ${low ? 'card--low' : ''}" data-id="${c.id}">
        <div class="card__top">
          <div class="card__icon">${iconoDeCategoria(c.category)}</div>
          <div class="card__title">
            <span class="card__tag">${escapeHtml(c.category)}</span>
            <div class="card__name">${escapeHtml(c.name)}</div>
          </div>
          <div class="card__qty ${low ? 'low' : ''}">${c.quantity}</div>
        </div>
        <div class="card__meta">${metaLines}</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.card').forEach((cardEl) => {
    cardEl.addEventListener('click', () => abrirEdicion(cardEl.dataset.id));
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// --- Drawer (crear/editar) ---

function abrirDrawer() {
  overlay.classList.remove('hidden');
  drawer.classList.remove('hidden');
}

function cerrarDrawer() {
  overlay.classList.add('hidden');
  drawer.classList.add('hidden');
  form.reset();
  el('f-id').value = '';
  el('btn-delete').classList.add('hidden');
}

function abrirNuevo() {
  form.reset();
  el('f-id').value = '';
  el('drawer-title').textContent = 'Nuevo componente';
  el('btn-delete').classList.add('hidden');
  abrirDrawer();
}

async function abrirEdicion(id) {
  const res = await fetch(`${API}/${id}`);
  if (!res.ok) return;
  const c = await res.json();

  el('f-id').value = c.id;
  el('f-name').value = c.name || '';
  el('f-category').value = c.category || '';
  el('f-subcategory').value = c.subcategory || '';
  el('f-value').value = c.value_spec || '';
  el('f-voltage').value = c.voltage || '';
  el('f-tolerance').value = c.tolerance || '';
  el('f-package').value = c.package_type || '';
  el('f-location').value = c.location || '';
  el('f-quantity').value = c.quantity ?? 0;
  el('f-min-quantity').value = c.min_quantity ?? 0;
  el('f-manufacturer').value = c.manufacturer || '';
  el('f-part-number').value = c.part_number || '';
  el('f-datasheet').value = c.datasheet_url || '';
  el('f-notes').value = c.notes || '';

  el('drawer-title').textContent = `Editar #${c.id}`;
  el('btn-delete').classList.remove('hidden');
  abrirDrawer();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = el('f-id').value;
  const datos = {
    name: el('f-name').value.trim(),
    category: el('f-category').value.trim(),
    subcategory: el('f-subcategory').value.trim() || undefined,
    value_spec: el('f-value').value.trim() || undefined,
    voltage: el('f-voltage').value.trim() || undefined,
    tolerance: el('f-tolerance').value.trim() || undefined,
    package_type: el('f-package').value.trim() || undefined,
    location: el('f-location').value.trim() || undefined,
    quantity: Number(el('f-quantity').value) || 0,
    min_quantity: Number(el('f-min-quantity').value) || 0,
    manufacturer: el('f-manufacturer').value.trim() || undefined,
    part_number: el('f-part-number').value.trim() || undefined,
    datasheet_url: el('f-datasheet').value.trim() || undefined,
    notes: el('f-notes').value.trim() || undefined,
  };

  if (id) {
    await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
  } else {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
  }

  cerrarDrawer();
  await Promise.all([cargarCategorias(), cargarComponentes()]);
});

el('btn-delete').addEventListener('click', async () => {
  const id = el('f-id').value;
  if (!id) return;
  if (!confirm('¿Eliminar este componente?')) return;

  await fetch(`${API}/${id}`, { method: 'DELETE' });
  cerrarDrawer();
  await Promise.all([cargarCategorias(), cargarComponentes()]);
});

el('btn-new').addEventListener('click', abrirNuevo);
el('btn-cancel').addEventListener('click', cerrarDrawer);
el('drawer-close').addEventListener('click', cerrarDrawer);
overlay.addEventListener('click', cerrarDrawer);

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(cargarComponentes, 250);
});
categoryFilter.addEventListener('change', cargarComponentes);
lowStockToggle.addEventListener('change', cargarComponentes);

// Init
cargarCategorias();
cargarComponentes();
