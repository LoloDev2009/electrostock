# Inventario de componentes electrónicos

App web + bot de Discord para llevar el inventario de tus componentes y materiales, con specs técnicas (voltaje, tolerancia, encapsulado, etc.). Ambos comparten la misma base de datos PostgreSQL, así que agregar algo desde Discord se refleja al instante en la web y viceversa.

```
inventario-electronico/
├── db/schema.sql          # esquema de PostgreSQL
├── backend/                # API REST + sirve la app web (incluye su copia de shared/)
├── bot/                     # bot de Discord — slash commands (incluye su copia de shared/)
├── frontend/public/        # app web (HTML/CSS/JS, sin build)
└── .env.example
```

> `backend/shared/` y `bot/shared/` son dos copias de la misma lógica de datos (conexión a Postgres + queries). Están duplicadas a propósito: así cada servicio es autocontenido y se puede desplegar como "Root Directory" independiente en Render, Railway, etc. sin que se rompa el `require`. Si cambiás algo en una, replicalo en la otra.

## 1. Requisitos

- Node.js 18+
- PostgreSQL 13+ (local o remoto, ej. Supabase, Railway, Neon)
- Una aplicación de Discord con bot (para el bot) — créala en https://discord.com/developers/applications

## 2. Base de datos

Crea la base de datos y carga el esquema:

```bash
createdb inventario
psql -d inventario -f db/schema.sql
```

Si usas un proveedor en la nube, solo necesitas la cadena de conexión (`DATABASE_URL`) y correr el mismo `schema.sql` contra ella.

## 3. Configuración

```bash
cp .env.example .env
```

Completa `.env`:

- `DATABASE_URL`: cadena de conexión a Postgres.
- `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`: en el panel de tu app de Discord → sección "Bot" y "General Information".
- `DISCORD_GUILD_ID`: click derecho en tu servidor de Discord (con modo desarrollador activado) → "Copiar ID". Esto registra los comandos al instante solo en ese servidor (para registro global, que tarda ~1h en propagarse, cambia `applicationGuildCommands` por `applicationCommands` en `bot/bot.js`).

Invita el bot a tu servidor con los scopes `bot` y `applications.commands` desde el "OAuth2 URL Generator" del panel de Discord.

## Login de la web

La app web pide una contraseña única antes de mostrar nada (no hay usuarios individuales, es un solo acceso compartido). Para configurarla:

```bash
cd backend
node scripts/hash-password.js "tu-contraseña-elegida"
```

Copiá el hash que te imprime a `APP_PASSWORD_HASH` en tu `.env`, y agregá cualquier cadena aleatoria larga como `JWT_SECRET` (por ejemplo, generala con `openssl rand -hex 32`). La sesión dura 30 días; para cerrarla antes, usá el botón "Salir" del header.

⚠️ Si desplegás en la nube (Render, etc.), agregá `APP_PASSWORD_HASH` y `JWT_SECRET` como variables de entorno del servicio backend — no subas el `.env` real a git (ya está en `.gitignore`).

## 4. Instalar y correr

**Backend (API + app web):**
```bash
cd backend
npm install
npm start
```
Abre http://localhost:3000

**Bot de Discord** (en otra terminal):
```bash
cd bot
npm install
npm start
```

## 5. Comandos del bot

| Comando | Qué hace |
|---|---|
| `/agregar` | Agrega un componente (nombre, categoría, cantidad + specs opcionales) |
| `/listar [categoria]` | Lista componentes, opcionalmente filtrados |
| `/buscar <termino>` | Busca por nombre, valor o número de parte |
| `/actualizar <id> <delta>` | Suma o resta cantidad (usa negativo para restar) |
| `/eliminar <id>` | Elimina un componente |
| `/stock-bajo` | Muestra qué está por debajo del mínimo configurado |

## 6. Campos del inventario

Cada componente guarda: nombre, categoría, subcategoría, valor/spec (ej. `10kΩ`, `100µF`), voltaje, tolerancia, encapsulado (THT, SMD 0805, DIP-8...), cantidad, cantidad mínima (para alertas de stock bajo), ubicación física, fabricante, número de parte, link a datasheet y notas.

## Notas

- El campo "mínimo" en cada componente dispara la alerta de stock bajo (`/stock-bajo` y el filtro en la web) cuando `cantidad <= mínimo`.
- La búsqueda usa `pg_trgm` para tolerar errores de tipeo; el esquema la habilita automáticamente.
- No se usa ningún build step en el frontend — es HTML/CSS/JS servido directo por Express, así que no hace falta `npm run build`.
