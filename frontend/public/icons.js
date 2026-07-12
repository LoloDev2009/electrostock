// Íconos de referencia por categoría. No dependen de internet: son SVG en línea.
// Cada regla se prueba contra el nombre de categoría normalizado (sin acentos, en minúscula).

const SVG_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

const ICONOS = {
  resistencia: `<svg ${SVG_ATTRS}><polyline points="2,12 5,12 7,6 10,18 13,6 16,18 18,12 22,12"/></svg>`,

  capacitor: `<svg ${SVG_ATTRS}><line x1="2" y1="12" x2="10" y2="12"/><line x1="10" y1="4" x2="10" y2="20"/><line x1="14" y1="4" x2="14" y2="20"/><line x1="14" y1="12" x2="22" y2="12"/></svg>`,

  inductor: `<svg ${SVG_ATTRS}><line x1="1" y1="12" x2="4" y2="12"/><path d="M4 12a2 2 0 0 1 4 0 2 2 0 0 1 4 0 2 2 0 0 1 4 0 2 2 0 0 1 4 0"/><line x1="20" y1="12" x2="23" y2="12"/></svg>`,

  diodo: `<svg ${SVG_ATTRS}><line x1="2" y1="12" x2="8" y2="12"/><polygon points="8,6 8,18 16,12" fill="currentColor" stroke="none"/><line x1="16" y1="6" x2="16" y2="18"/><line x1="16" y1="12" x2="22" y2="12"/></svg>`,

  transistor: `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="8"/><line x1="8" y1="8" x2="8" y2="16"/><line x1="8" y1="9" x2="15" y2="6"/><line x1="8" y1="15" x2="15" y2="18"/><line x1="15" y1="6" x2="18" y2="3"/><line x1="15" y1="18" x2="18" y2="21"/><line x1="2" y1="12" x2="8" y2="12"/></svg>`,

  ci: `<svg ${SVG_ATTRS}><rect x="6" y="6" width="12" height="12" rx="1"/><line x1="8" y1="6" x2="8" y2="2"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="16" y1="6" x2="16" y2="2"/><line x1="8" y1="18" x2="8" y2="22"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="16" y1="18" x2="16" y2="22"/></svg>`,

  conector: `<svg ${SVG_ATTRS}><rect x="4" y="8" width="10" height="8" rx="1"/><line x1="7" y1="8" x2="7" y2="4"/><line x1="11" y1="8" x2="11" y2="4"/><line x1="14" y1="10" x2="20" y2="10"/><line x1="14" y1="14" x2="20" y2="14"/></svg>`,

  sensor: `<svg ${SVG_ATTRS}><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/></svg>`,

  modulo: `<svg ${SVG_ATTRS}><rect x="3" y="5" width="18" height="14" rx="1"/><rect x="6" y="8" width="4" height="4"/><rect x="14" y="8" width="4" height="4"/><line x1="6" y1="15" x2="18" y2="15"/></svg>`,

  cable: `<svg ${SVG_ATTRS}><path d="M2 12 q3 -6 6 0 t 6 0 t 6 0 t 6 0"/></svg>`,

  bateria: `<svg ${SVG_ATTRS}><rect x="2" y="7" width="18" height="10" rx="1.5"/><line x1="22" y1="10" x2="22" y2="14"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="10" y1="9" x2="10" y2="15"/></svg>`,

  interruptor: `<svg ${SVG_ATTRS}><rect x="2" y="9" width="20" height="6" rx="3"/><circle cx="8" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>`,

  herramienta: `<svg ${SVG_ATTRS}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"/></svg>`,

  mecanico: `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>`,

  otro: `<svg ${SVG_ATTRS}><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="2"/></svg>`,
};

// Palabra clave a buscar dentro del nombre de categoría -> ícono a usar
const REGLAS = [
  [/resist/, 'resistencia'],
  [/capacit/, 'capacitor'],
  [/induct|bobina/, 'inductor'],
  [/diodo|led/, 'diodo'],
  [/transistor|mosfet|fet\b/, 'transistor'],
  [/microcontrolador|mcu|arduino|esp32|esp8266|raspberry/, 'ci'],
  [/circuito integrado|\bci\b/, 'ci'],
  [/conector|plug|jack|terminal/, 'conector'],
  [/sensor/, 'sensor'],
  [/modulo|módulo|board|placa/, 'modulo'],
  [/cable|jumper|alambre/, 'cable'],
  [/bateria|batería|pila|cargador/, 'bateria'],
  [/switch|interruptor|boton|botón|pulsador/, 'interruptor'],
  [/herramienta|tool|soldador|cautin|cautín/, 'herramienta'],
  [/mecanic|mecánic|tornillo|tuerca|espaciador/, 'mecanico'],
];

function normalizar(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function iconoDeCategoria(category) {
  const norm = normalizar(category);
  for (const [regex, clave] of REGLAS) {
    if (regex.test(norm)) return ICONOS[clave];
  }
  return ICONOS.otro;
}
