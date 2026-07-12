const API = '/api/components';

// Envoltorio de fetch para la API protegida: si la sesión expiró (401),
// vuelve a mostrar el login en vez de dejar la app rota a medias.
async function apiFetch(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    mostrarLogin('Tu sesión expiró, ingresá de nuevo.');
    throw new Error('No autenticado');
  }
  return res;
}

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

const viewGrid = el('view-grid');
const viewTable = el('view-table');
const viewShopping = el('view-shopping');
const sidebarCategories = el('sidebar-categories');

let debounceTimer;
let itemsCache = {};      // id -> componente, para no re-pedir al servidor en cada ajuste de cantidad
let currentView = 'grid'; // 'grid' | 'table' | 'shopping'
let currentCategory = null;

// --- Utilidades ---

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

function esStockBajo(c) {
  return c.min_quantity > 0 && c.quantity <= c.min_quantity;
}

// Control de cantidad reutilizable (tarjetas, tabla y lista de compras).
// Tocar el número abre los botones −/+; tocar afuera los cierra.
function renderQtyControl(c) {
  const low = esStockBajo(c) ? 'low' : '';
  return `
    <div class="qty" data-id="${c.id}">
      <button type="button" class="qty__btn" data-action="dec" aria-label="Restar uno">−</button>
      <span class="qty__value ${low}" data-action="toggle">${c.quantity}</span>
      <button type="button" class="qty__btn" data-action="inc" aria-label="Sumar uno">+</button>
    </div>
  `;
}

function actualizarQtyEnDOM(c) {
  document.querySelectorAll(`.qty[data-id="${c.id}"]`).forEach((wrap) => {
    const span = wrap.querySelector('.qty__value');
    span.textContent = c.quantity;
    const low = esStockBajo(c);
    span.classList.toggle('low', low);
    const card = wrap.closest('.card');
    if (card) card.classList.toggle('card--low', low);
    const row = wrap.closest('tr');
    if (row) row.classList.toggle('row--low', low);
  });
}

async function ajustarCantidad(id, delta) {
  const res = await apiFetch(`${API}/${id}/cantidad`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) return;
  const actualizado = await res.json();
  itemsCache[id] = actualizado;

  // Si el ajuste puede sacar/meter el ítem de la vista actual, se re-renderiza esa vista completa.
  if (currentView === 'shopping') {
    cargarListaCompras();
  } else if (currentView === 'grid' && lowStockToggle.checked) {
    cargarComponentes();
  } else {
    actualizarQtyEnDOM(actualizado);
  }
}

// Un solo listener delegado maneja todos los controles de cantidad de la página.
document.addEventListener('click', (e) => {
  const qtyBtn = e.target.closest('.qty__btn');
  const qtyValue = e.target.closest('.qty__value');
  const qtyWrap = e.target.closest('.qty');

  if (qtyBtn) {
    const wrap = qtyBtn.closest('.qty');
    const delta = qtyBtn.dataset.action === 'inc' ? 1 : -1;
    ajustarCantidad(wrap.dataset.id, delta);
    return;
  }
  if (qtyValue) {
    const wrap = qtyValue.closest('.qty');
    document.querySelectorAll('.qty--open').forEach((w) => { if (w !== wrap) w.classList.remove('qty--open'); });
    wrap.classList.toggle('qty--open');
    return;
  }
  if (!qtyWrap) {
    document.querySelectorAll('.qty--open').forEach((w) => w.classList.remove('qty--open'));
  }
});

// --- Navegación (sidebar) ---

function marcarActivo(view, category) {
  document.querySelectorAll('.sidebar__item').forEach((b) => b.classList.remove('active'));
  if (view === 'table') {
    const btn = sidebarCategories.querySelector(`[data-category="${CSS.escape(category)}"]`);
    if (btn) btn.classList.add('active');
  } else {
    const btn = document.querySelector(`.sidebar__item[data-view="${view}"]`);
    if (btn) btn.classList.add('active');
  }
}

function setView(view, category) {
  currentView = view;
  currentCategory = category || null;

  viewGrid.classList.add('hidden');
  viewTable.classList.add('hidden');
  viewShopping.classList.add('hidden');

  marcarActivo(view, category);

  if (view === 'grid') {
    viewGrid.classList.remove('hidden');
    cargarComponentes();
  } else if (view === 'table') {
    viewTable.classList.remove('hidden');
    cargarTablaCategoria(category);
  } else if (view === 'shopping') {
    viewShopping.classList.remove('hidden');
    cargarListaCompras();
  }
}

el('sidebar').querySelectorAll('.sidebar__item[data-view]').forEach((btn) => {
  if (btn.closest('#sidebar-categories')) return;
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

// --- Carga de categorías (dropdown del grid + lista del sidebar) ---

async function cargarCategorias() {
  const res = await apiFetch(`${API}/categorias`);
  const cats = await res.json();

  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map((c) => `<option value="${escapeHtml(c.category)}">${escapeHtml(c.category)} (${c.total})</option>`).join('');
  categoryList.innerHTML = cats.map((c) => `<option value="${escapeHtml(c.category)}">`).join('');

  const totalItems = cats.reduce((sum, c) => sum + c.total, 0);
  const totalComponents = cats.reduce((sum, c) => sum + c.total_components, 0);
  headerStats.innerHTML = `
    <div><b>${totalItems}</b>referencias</div>
    <div><b>${totalComponents}</b>componentes</div>
    <div><b>${cats.length}</b>categorías</div>
  `;

  sidebarCategories.innerHTML = cats.map((c) => `
    <button type="button" class="sidebar__item sidebar__item--category" data-view="table" data-category="${escapeHtml(c.category)}">
      <span>${escapeHtml(c.category)}</span><span class="sidebar__count">${c.total}</span>
    </button>
  `).join('');

  sidebarCategories.querySelectorAll('.sidebar__item--category').forEach((btn) => {
    btn.addEventListener('click', () => setView('table', btn.dataset.category));
  });

  if (currentView === 'table' && currentCategory) marcarActivo('table', currentCategory);
}

// --- Vista: inventario (tarjetas) ---

async function cargarComponentes() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
  if (categoryFilter.value) params.set('category', categoryFilter.value);
  if (lowStockToggle.checked) params.set('lowStock', 'true');

  const res = await apiFetch(`${API}?${params.toString()}`);
  const items = await res.json();
  render(items);
}

function render(items) {
  items.forEach((c) => { itemsCache[c.id] = c; });

  if (items.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  grid.innerHTML = items.map((c) => {
    const low = esStockBajo(c);
    const metaLines = [
      c.value_spec && `spec: ${escapeHtml(c.value_spec)}`,
      c.package_type && `pkg: ${escapeHtml(c.package_type)}`,
      c.voltage && `V: ${escapeHtml(c.voltage)}`,
      c.tolerance && `tol: ${escapeHtml(c.tolerance)}`,
      c.location && `📍 ${escapeHtml(c.location)}`,
    ].filter(Boolean).join('<br>');

    return `
      <div class="card ${low ? 'card--low' : ''}" data-id="${c.id}">
        <div class="card__top">
          <div class="card__icon">${iconoDeCategoria(c.category)}</div>
          <div class="card__title">
            <span class="card__tag">${escapeHtml(c.category)}</span>
            <div class="card__name">${escapeHtml(c.name)}</div>
          </div>
          ${renderQtyControl(c)}
        </div>
        <div class="card__meta">${metaLines}</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.card').forEach((cardEl) => {
    cardEl.addEventListener('click', (e) => {
      if (e.target.closest('.qty')) return;
      abrirEdicion(cardEl.dataset.id);
    });
  });
}

// --- Vista: tabla por categoría ---

async function cargarTablaCategoria(category) {
  el('table-title').textContent = category;
  const res = await apiFetch(`${API}?category=${encodeURIComponent(category)}`);
  const items = await res.json();
  items.forEach((c) => { itemsCache[c.id] = c; });

  const tbody = el('table-body');

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Sin componentes en esta categoría.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((c) => `
    <tr class="${esStockBajo(c) ? 'row--low' : ''}" data-row-id="${c.id}">
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.value_spec || '—')}</td>
      <td>${renderQtyControl(c)}</td>
      <td>${escapeHtml(c.location || '—')}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-row-id]').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.qty')) return;
      abrirEdicion(tr.dataset.rowId);
    });
  });
}

// --- Vista: lista de compras (stock bajo) ---

async function cargarListaCompras() {
  const res = await apiFetch(`${API}/stock-bajo`);
  const items = await res.json();
  items.forEach((c) => { itemsCache[c.id] = c; });

  const list = el('shopping-list');

  if (items.length === 0) {
    list.innerHTML = `<li class="muted">No hay componentes con stock bajo. ✅</li>`;
    return;
  }

  list.innerHTML = items.map((c) => {
    const faltan = Math.max((c.min_quantity || 0) - c.quantity, 0);
    return `
      <li class="shopping-item" data-row-id="${c.id}">
        <div class="shopping-item__icon">${iconoDeCategoria(c.category)}</div>
        <div class="shopping-item__info">
          <div class="shopping-item__name">${escapeHtml(c.name)}</div>
          <div class="shopping-item__meta">tenés ${c.quantity} · mínimo ${c.min_quantity}${faltan ? ` · comprar al menos ${faltan}` : ''}</div>
        </div>
        ${renderQtyControl(c)}
      </li>
    `;
  }).join('');

  list.querySelectorAll('.shopping-item').forEach((li) => {
    li.addEventListener('click', (e) => {
      if (e.target.closest('.qty')) return;
      abrirEdicion(li.dataset.rowId);
    });
  });
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
  const res = await apiFetch(`${API}/${id}`);
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

async function refrescarVistaActual() {
  await cargarCategorias();
  if (currentView === 'grid') await cargarComponentes();
  else if (currentView === 'table') await cargarTablaCategoria(currentCategory);
  else if (currentView === 'shopping') await cargarListaCompras();
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
    await apiFetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
  } else {
    await apiFetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
  }

  cerrarDrawer();
  await refrescarVistaActual();
});

el('btn-delete').addEventListener('click', async () => {
  const id = el('f-id').value;
  if (!id) return;
  if (!confirm('¿Eliminar este componente?')) return;

  await apiFetch(`${API}/${id}`, { method: 'DELETE' });
  cerrarDrawer();
  await refrescarVistaActual();
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

// --- Autenticación ---

const loginOverlay = el('login-overlay');
const loginForm = el('login-form');
const loginPassword = el('login-password');
const loginError = el('login-error');
const board = el('board');

function mostrarLogin(mensaje) {
  board.classList.add('hidden');
  loginOverlay.classList.remove('hidden');
  if (mensaje) {
    loginError.textContent = mensaje;
    loginError.classList.remove('hidden');
  }
  loginPassword.value = '';
  loginPassword.focus();
}

function mostrarApp() {
  loginOverlay.classList.add('hidden');
  loginError.classList.add('hidden');
  board.classList.remove('hidden');
  cargarCategorias();
  cargarComponentes();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: loginPassword.value }),
  });

  if (res.ok) {
    mostrarApp();
  } else {
    const data = await res.json().catch(() => ({}));
    loginError.textContent = data.error || 'No se pudo iniciar sesión';
    loginError.classList.remove('hidden');
    loginPassword.value = '';
    loginPassword.focus();
  }
});

el('btn-logout').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  mostrarLogin();
});

// Init: revisa si ya hay sesión activa (cookie) antes de mostrar login o app
(async function init() {
  const res = await fetch('/api/auth/status');
  const { authenticated } = await res.json();
  if (authenticated) mostrarApp();
  else loginOverlay.classList.remove('hidden');
})();
