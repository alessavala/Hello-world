# Creator Commerce Frontend

Frontend web (Next.js 16, App Router, TypeScript, Tailwind v4) para el marketplace P2P de [`creator-commerce-backend`](../creator-commerce-backend). Consume la API REST directamente desde el navegador (no hay capa BFF/Server Actions propia) usando el JWT emitido por el backend.

## Estado actual

- Landing pública (`/`, sin login) con CTA a registro de marca o creador; usuarios ya logueados son redirigidos automáticamente a `/creators`.
- Auth: registro/login con selector de rol (Creador/Marca), sesión persistida en `localStorage`, más botones de "Continuar con Google/Facebook" que aparecen solos cuando el backend tiene esos providers configurados (si no, no se muestran - no hace falta nada extra para que el resto de la app funcione).
- Discovery de creadores: búsqueda por nombre, chips de filtro (verificados, marketplace), panel de filtro por categoría, grilla de tarjetas, paginación, botón de favorito (♥) para marcas.
- Perfil de creador (`/creators/:id`): passport (score, campañas completadas, on-time, rating, rehire, first-approval, disputas), marketplaces con estado de verificación, redes sociales, portafolio con **embeds oficiales de TikTok/Instagram** (blockquote + `embed.js`, sin alojar contenido propio), reseñas recibidas con promedio, botón de favorito para marcas.
- Mi perfil (`/profile`, editable, según el rol logueado):
  - Creador: datos básicos, redes sociales (alta/baja), marketplaces (alta/baja, verificación la hace un admin), categorías/nichos (toggle), portafolio (alta/baja de links a TikTok/Instagram/YouTube/Facebook).
  - Marca: datos básicos del negocio.
- Campañas (`/campaigns`, según el rol logueado):
  - Marca: lista de sus campañas con estado, wizard de 2 pasos para crear (marketplace/categoría → nombre/descripción/compensación/requisitos), publicar/pausar/reanudar/cerrar.
  - Creador: campañas publicadas por cualquier marca (con nombre e insignia de verificación de la marca), postularse con un click (deshabilitado si ya se postuló).
- Colaboraciones (`/collaborations`): estado de cada colaboración aceptada, con acción de "Dejar reseña" (bidireccional: marca y creador) al llegar a `COMPLETED`.
- Favoritos (`/favorites`, solo marcas): lista de creadores guardados, con opción de quitar.
- Panel de administración (`/admin`, solo rol ADMIN): dashboard con contadores, tablas de usuarios/creadores/marcas/campañas/colaboraciones/disputas, acciones de verificar creador/marca y suspender usuario.

Estilo visual inspirado en las referencias que compartiste (fondo cálido, badge tipo píldora para el logo, acentos ámbar, chips redondeados) — el wordmark usa un placeholder (`creator.hub`), reemplazalo por tu marca real en `src/components/logo.tsx`.

## Requisitos

- Node.js 22+
- El backend (`creator-commerce-backend`) corriendo en `http://localhost:4000` (o la URL que configures).

## Instalación

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Necesitás el backend corriendo (`npm run start:dev` en `../creator-commerce-backend`) para que cualquier pantalla funcione, ya que no hay datos mockeados.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL de la API REST del backend (incluye `/api/v1`) |
| `NEXT_PUBLIC_WS_URL` | Base URL del backend para el WebSocket de chat (sin path, se usa `/chat` como namespace) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Opcional - mismo valor que `GOOGLE_CLIENT_ID` del backend. Sin esto, el botón de Google no se muestra. Ver "Login social" en el README del backend. |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Opcional - mismo valor que `FACEBOOK_APP_ID` del backend. Sin esto, el botón de Facebook no se muestra. |

Como son `NEXT_PUBLIC_*`, quedan inlineados en el bundle en **build time** - si los cambiás, hay que rebuildear (`npm run build` en dev con Turbopack esto no aplica, pero sí en la imagen Docker de producción).

## Estructura

```
src/
  app/
    page.tsx                landing pública (sin login) o redirect a /creators
    login/, register/       pantallas de auth
    creators/                discovery + [id] detalle de creador (passport, portafolio, reseñas)
    campaigns/                dispatch por rol: marca gestiona, creador se postula
    collaborations/           estado + acción de reseña bidireccional
    favorites/                creadores guardados (solo marcas)
    admin/                    panel de administración (solo rol ADMIN)
    profile/                  mi perfil (dispatch por rol: creador vs marca)
    layout.tsx               fonts, AuthProvider, estilos globales
  components/                 Logo, Button, Chip, Input, Select, AppShell, CreatorCard,
                               CampaignCard, CampaignWizard, BrandProfileForm, CreatorProfileForm,
                               SocialEmbed, ReviewForm, SocialLoginButtons
    creator-profile/           BasicInfoForm, SocialAccountsSection, MarketplacesSection,
                               CategoriesSection, PortfolioSection
  lib/
    api.ts                    wrapper fetch tipado + manejo de errores del backend
    auth-context.tsx          estado de sesión (React Context + localStorage)
    use-favorites.ts           hook de favoritos (ids + toggle optimista con rollback en error)
    types.ts                  tipos espejo de los DTOs/respuestas del backend
```

## Notas técnicas

- **Client-rendered, no Server Components para datos de la API**: dado que el backend es un servicio externo separado (no una base de datos co-ubicada), las pantallas que consumen la API son Client Components que hacen `fetch` directo desde el navegador con el JWT en el header `Authorization`. Esto evita duplicar lógica de auth en una capa BFF que no aporta nada en este caso.
- **`react-hooks/set-state-in-effect`**: este proyecto usa la config de lint más reciente de Next (basada en las reglas de React Compiler), que marca como error el patrón común "fetch en un efecto y actualizar loading state". Es un patrón válido para fetch-on-mount/fetch-on-param-change sin Suspense; donde aparece, está silenciado línea por línea con un comentario explicando por qué.
- **Embeds de portafolio sin alojar contenido**: `SocialEmbed` carga el `embed.js` oficial de TikTok/Instagram una sola vez y renderiza un `<blockquote>` que cada script hidrata con el contenido real desde el CDN de la plataforma - el creador solo pega el link, nunca sube ni aloja el video.
- **`useFavoriteIds`**: actualización optimista (el ♥ cambia al instante) con rollback automático si el POST/DELETE falla - por ejemplo, si la marca todavía no completó su perfil, el corazón vuelve a su estado anterior y se muestra el error traducido.
- **`SocialLoginButtons`**: no renderiza nada si ninguno de los dos providers está configurado (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`/`NEXT_PUBLIC_FACEBOOK_APP_ID`), y cada botón se muestra u oculta de forma independiente. Si el script externo (Google/Facebook) no llega a cargar, se lo reporta como error traducido en vez de romper la pantalla - probado explícitamente simulando el fallo de red.
- Quedan por construir: entregables (subida/revisión desde el frontend - el backend ya soporta el flujo), chat (backend y WebSocket listos, falta la pantalla), y verificación de marketplaces individual desde el panel admin (el backend expone el endpoint, la UI hoy solo cubre verificación de creador/marca).

## Deploy a producción

Ver [`../DEPLOYMENT.md`](../DEPLOYMENT.md) en la raíz del repo para la guía de deploy con Docker + Caddy en un VPS.
