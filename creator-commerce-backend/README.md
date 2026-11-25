# Creator Commerce Backend

Backend REST para un marketplace P2P que conecta **marcas / sellers** con **creadores de contenido** especializados en promocionar productos en **Amazon Afiliados**, **Mercado Libre Afiliados** y **TikTok Shop**.

El valor del creador no se mide solo por seguidores: la plataforma construye un **Creator Passport** derivado 100% del historial real (campañas completadas, entregas a tiempo, calificaciones, tasa de re-contratación, tasa de disputas), imposible de editar manualmente.

No incluye (fuera de alcance del MVP, ver "Próxima fase" al final): Shopify, sistema propio de afiliados/links de referidos, tracking propio de ventas, wallet, procesamiento de pagos, comisiones automáticas, microservicios.

## 1. Descripción del proyecto

Monolito modular en NestJS que implementa el flujo completo de un marketplace de creator commerce:

- **CREATOR**: perfil, redes sociales, afiliaciones a marketplaces, portafolio (links a TikTok/Instagram, sin alojar contenido propio), categorías/nichos, búsqueda y postulación a campañas, invitaciones, colaboraciones, entregables, reviews bidireccionales, reputación (Creator Passport), chat directo con marcas.
- **BRAND**: perfil, productos, campañas, descubrimiento de creadores, creadores favoritos (shortlist personal), invitaciones, revisión de postulaciones, gestión de colaboraciones, entregables, reviews bidireccionales, chat directo con creadores.
- **ADMIN**: dashboard, gestión de usuarios, verificación de creadores/marcas/marketplaces, mediación de disputas, auditoría de actividad.
- **Notificaciones por email**: aplicaciones/invitaciones nuevas, cambios de estado, reviews recibidas y cambios de verificación disparan un correo (vía `MailService`); sin `SMTP_HOST` configurado, se loguean en vez de enviarse, así que el resto de la app funciona igual sin un proveedor de email configurado.
- **Login social**: registro/login con Google (Google Identity Services) y Facebook (Facebook Login), además del login con email/contraseña. Un email existente se vincula automáticamente al provider social si coincide, en vez de crear una cuenta duplicada. Ver sección 5.1.

## 2. Arquitectura

**Monolito modular** (sin microservicios). Cada dominio vive en su propio módulo NestJS con `controller` + `service` + `dto`, todos montados sobre una única base de datos PostgreSQL vía Prisma.

```
src/
  common/            infraestructura transversal
    auth.ts              guards JWT + RBAC, decoradores @Roles/@Public/@CurrentUser
    http-exception.filter.ts   filtro global de excepciones (incl. errores Prisma -> HTTP)
    pagination.ts         DTO y helpers de paginación estándar
    activity-log.service.ts   auditoría (fire-and-forget, no rompe la operación de negocio)
    reputation.service.ts     cálculo derivado del Creator Passport / Reliability Score
    matching.ts            motor de matching basado en reglas (sin ML)
    mail.service.ts         notificaciones por email (opcional, SMTP configurable, no-op si no hay SMTP_HOST)
  prisma/            PrismaService/PrismaModule (@Global)
  auth/              registro, login, JWT
  creators/          perfil, redes sociales, marketplaces, categorías, portafolio, discovery, passport
  brands/            perfil de marca
  products/          catálogo de productos de la marca
  categories/         catálogo de categorías/nichos (lookup público)
  campaigns/         ciclo de vida de campañas + máquina de estados
  applications/      postulaciones e invitaciones (fuente única de verdad para ambas)
  collaborations/    máquina de estados de la colaboración end-to-end
  deliverables/       entregables, revisiones, publicación
  reviews/           calificaciones bidireccionales
  disputes/          apertura y mediación de disputas
  chat/              mensajería 1:1 marca <-> creador (REST + WebSocket en tiempo real)
  favorites/         marcas guardan creadores para contactar más adelante
  admin/             panel administrativo
```

**Por qué monolito modular:** un solo proceso, un solo schema, transacciones ACID reales entre módulos (crítico para "aceptar aplicación => crear colaboración" o "abrir disputa => cambiar estado de colaboración"). Cada módulo es lo bastante aislado como para extraerse a un servicio propio en el futuro si el equipo crece, pero eso no es una necesidad del MVP.

**Decisiones de diseño relevantes:**

- **Invitaciones sin tabla nueva**: `CampaignApplication` tiene un campo `source` (`APPLICATION` | `INVITATION`). Una invitación es una aplicación creada por la marca con estado `INVITED`; el creador la acepta/rechaza. Esto reutiliza el mismo unique constraint `[campaignId, creatorId]`, evitando que un creador tenga simultáneamente una aplicación y una invitación activas para la misma campaña.
- **Requisitos de campaña embebidos**: en vez de una tabla `CampaignRequirement` separada, los campos (`minFollowers`, `minAverageViews`, `targetCountry`, `deliverableDescription`, etc.) viven directamente en `Campaign`. Es una relación 1:1 forzosa sin necesidad real de independencia de ciclo de vida, así que separarla sería complejidad sin beneficio.
- **Reputación 100% derivada**: ningún DTO acepta `reliabilityScore` ni las demás métricas del passport. Se recalculan server-side (`ReputationService.recompute`) tras completar una colaboración, crear una review o resolver una disputa.
- **Chat sin acoplar a una colaboración**: un thread es único por par `(brandId, creatorId)` y puede abrirse desde discovery, antes de que exista ninguna aplicación/invitación/colaboración — así una marca puede negociar con un creador antes de comprometerse formalmente. Si ya existe una `Collaboration` entre ese par, el thread queda enlazado a ella automáticamente (solo informativo). La persistencia del mensaje vive únicamente en `ChatService` (vía REST); el `ChatGateway` (Socket.IO) solo autentica el socket, gestiona membresía de salas y hace `broadcast` — un único camino de escritura, sin lógica de negocio duplicada entre HTTP y WebSocket.

## 3. Requisitos

- Node.js 22+
- PostgreSQL 16
- Docker + Docker Compose (opcional, para levantar Postgres localmente)

## 4. Instalación

```bash
git clone <repo>
cd creator-commerce-backend
cp .env.example .env
npm install
```

## 5. Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://creator:creator@localhost:5432/creator_commerce?schema=public` |
| `JWT_SECRET` | Secreto de firma JWT (mínimo 32 caracteres, cambiar en producción) | `replace-this-with-at-least-32-random-characters` |
| `JWT_EXPIRES_IN` | Expiración del access token | `7d` |
| `PORT` | Puerto HTTP | `4000` |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma | `http://localhost:3000` |
| `SMTP_HOST` | Servidor SMTP para notificaciones por email (opcional - sin esto, las notificaciones se loguean en vez de enviarse) | `smtp.sendgrid.net` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_SECURE` | `true` para TLS implícito (puerto 465) | `false` |
| `SMTP_USER` / `SMTP_PASS` | Credenciales SMTP | - |
| `SMTP_FROM` | Remitente de los correos | `Creator Commerce <no-reply@tudominio.com>` |
| `GOOGLE_CLIENT_ID` | Client ID de OAuth de Google (opcional - sin esto, `POST /auth/google` responde 503) | `123456-abc.apps.googleusercontent.com` |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Credenciales de la app de Facebook (opcional - sin esto, `POST /auth/facebook` responde 503) | - |

## 5.1 Login social (Google / Facebook)

El login social es opcional: sin estas variables configuradas, el frontend directamente no muestra los botones. Cuando lo quieras activar:

**Google:**
1. Andá a [Google Cloud Console](https://console.cloud.google.com/) → creá un proyecto (o usá uno existente).
2. **APIs & Services → OAuth consent screen**: configurala como "External", completá nombre de la app y email de contacto.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**, tipo **Web application**.
4. En **Authorized JavaScript origins** agregá el dominio del frontend (`http://localhost:3000` en dev, `https://tudominio.com` en producción). No hace falta configurar "Authorized redirect URIs" - el flujo que usamos (Google Identity Services) no redirige, entrega el token directo en el navegador.
5. Copiá el **Client ID** generado → es el valor de `GOOGLE_CLIENT_ID` (backend) **y** de `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) - son el mismo valor, solo con nombres de variable distintos en cada lado.

**Facebook:**
1. Andá a [Meta for Developers](https://developers.facebook.com/) → **Mis apps → Crear app** (tipo "Consumidor" o "Ninguno" alcanza).
2. Agregá el producto **Facebook Login**.
3. En **Configuración → Básica**, copiá el **ID de la app** y el **Secreto de la app** → `FACEBOOK_APP_ID` y `FACEBOOK_APP_SECRET`. El App ID también va en `NEXT_PUBLIC_FACEBOOK_APP_ID` del frontend (mismo valor).
4. En **Facebook Login → Configuración**, agregá el dominio del frontend en **Dominios de la app** (y el Site URL si te lo pide).
5. El permiso `email` es estándar y no necesita pasar por App Review para empezar a probar con vos mismo/testers agregados en **Roles → Testers**. Para que cualquier usuario pueda entrar (no solo testers) hay que pasar por la revisión de la app en Meta antes de ir a producción.

Con ambas variables del backend puestas y las `NEXT_PUBLIC_*` correspondientes en el frontend (ver su README), reiniciá ambos servicios y los botones van a aparecer solos en `/login` y `/register`.

## 6. Docker

```bash
docker compose up -d
```

Levanta PostgreSQL 16 en `localhost:5432` con las credenciales del `.env.example`. La app en sí no está dockerizada por defecto en desarrollo (se corre con `npm run start:dev`); el `Dockerfile` incluido sirve para build de producción (`docker build .`).

## 7. PostgreSQL

Si no usas Docker, crea manualmente la base de datos y el rol indicados en `DATABASE_URL`:

```bash
createdb creator_commerce
```

## 8. Prisma

El schema completo está en `prisma/schema.prisma`: 20 modelos (`User`, `CreatorProfile`, `BrandProfile`, `SocialAccount`, `CreatorMarketplace`, `Category`, `CreatorCategory`, `PortfolioItem`, `Favorite`, `Product`, `Campaign`, `CampaignApplication`, `Collaboration`, `Deliverable`, `DeliverableReview`, `Review`, `Dispute`, `ActivityLog`, `Conversation`, `Message`), con índices compuestos para las consultas de discovery/listing más frecuentes, `onDelete: Cascade` donde la relación es de propiedad exclusiva, y unique constraints que hacen imposible a nivel de base de datos: doble aplicación a la misma campaña, doble colaboración para la misma aplicación, doble review del mismo usuario a la misma colaboración, doble red social del mismo tipo/usuario.

```bash
npx prisma generate      # regenerar el cliente tras cambios de schema
```

## 9. Migraciones

```bash
npx prisma migrate dev --name init   # desarrollo: crea y aplica migración
npx prisma migrate deploy            # producción/CI: solo aplica migraciones existentes
```

## 10. Seed

```bash
npm run prisma:seed
```

Crea categorías base y tres usuarios de prueba:

| Rol | Email | Password |
|---|---|---|
| ADMIN | `admin@creatorcommerce.local` | `Admin123!` |
| CREATOR | `creator@creatorcommerce.local` | `Demo123!` |
| BRAND | `brand@creatorcommerce.local` | `Demo123!` |

Además de un producto y una campaña `PUBLISHED` de ejemplo. **Cambiar estas contraseñas antes de cualquier entorno compartido.**

## 11. Ejecutar en desarrollo

```bash
npm run start:dev
```

API disponible en `http://localhost:4000/api/v1`. Documentación interactiva (Swagger) en `http://localhost:4000/api/docs`.

## 12. Ejecutar en producción

```bash
npm run build
npm run prisma:deploy
npm run start:prod
```

O vía Docker:

```bash
docker build -t creator-commerce-backend .
docker run --env-file .env -p 4000:4000 creator-commerce-backend
```

## 13. Ejecutar tests

```bash
npm test         # unit tests (máquinas de estado, motor de matching, lógica de login social) - no requieren base de datos
npm run test:e2e # tests de integración contra una base de datos real
```

Los tests e2e usan una base de datos separada. Antes de correrlos por primera vez:

```bash
cp .env.test.example .env.test
DATABASE_URL="postgresql://creator:creator@localhost:5432/creator_commerce_test?schema=public" npx prisma migrate deploy
```

`test/app.e2e-spec.ts` cubre: registro/login, rechazo de registro duplicado y de auto-registro como ADMIN, guard de roles, mass-assignment protection (un cliente no puede setear `reliabilityScore`), ownership cruzado entre marcas (producto y campaña de otra marca), ciclo de vida de campaña con transiciones inválidas rechazadas, aplicación duplicada rechazada (409), aceptación de aplicación creando una única colaboración (sin duplicados aunque se acepte dos veces), transición ilegal de colaboración rechazada, flujo completo de entregables hasta `COMPLETED`, reviews (incluida la duplicada rechazada) y verificación de que el Creator Passport se recalcula con datos reales, el flujo completo de invitación (crear, aceptar/rechazar), chat (inicio de conversación idempotente, ownership, entrega de mensaje en tiempo real vía WebSocket con `socket.io-client` real, recibo de lectura broadcast), panel de admin (dashboard, verificación de creador/marca, guard de rol), favoritos (agregar/idempotencia/listar/quitar, guard de rol) y el endpoint público de reviews por usuario.

Estado actual: 27 unit tests + 55 e2e tests, todos pasando.

## 14. Swagger

`http://localhost:4000/api/docs` — generado automáticamente desde los DTOs (`class-validator`) vía el plugin de `@nestjs/swagger` en `nest-cli.json`, con autenticación Bearer configurada para probar endpoints protegidos directamente desde la UI.

## 15. Roles

| Rol | Puede |
|---|---|
| `CREATOR` | Gestionar su propio perfil, redes sociales, marketplaces, categorías, portafolio; buscar/postularse a campañas; responder invitaciones; avanzar su lado de la colaboración; subir/publicar entregables; calificar a la marca; abrir disputas; chatear con marcas |
| `BRAND` | Gestionar su propio perfil, productos, campañas; buscar/invitar creadores; revisar postulaciones (shortlist/aceptar/rechazar); avanzar su lado de la colaboración; crear/revisar entregables; calificar al creador; abrir disputas; chatear con creadores |
| `ADMIN` | Dashboard, listar usuarios/creadores/marcas/campañas/colaboraciones/disputas, suspender usuarios, verificar creadores/marcas/afiliaciones a marketplace, mediar y resolver disputas, ver log de actividad |

**El role guard nunca es la única defensa**: cada servicio valida además el *ownership* del recurso (una marca no puede editar la campaña de otra marca; un creador no puede modificar la postulación de otro creador; un extraño a una colaboración recibe 403 aunque su rol sea correcto).

## 16. Principales endpoints

Todos bajo el prefijo `/api/v1`. Ver Swagger para el detalle completo de request/response.

```
POST   /auth/register
POST   /auth/login
POST   /auth/google                    (idToken de Google Identity Services)
POST   /auth/facebook                  (accessToken del SDK de Facebook)
GET    /auth/me

PUT    /creators/me
GET    /creators/me
GET    /creators                       (búsqueda/discovery con filtros + paginación)
GET    /creators/:id
GET    /creators/:id/passport          (Creator Passport derivado)
POST   /creators/me/social-accounts
PATCH  /creators/me/social-accounts/:id
DELETE /creators/me/social-accounts/:id
POST   /creators/me/marketplaces       (Amazon / Mercado Libre / TikTok Shop)
PATCH  /creators/me/marketplaces/:id
DELETE /creators/me/marketplaces/:id
POST   /creators/me/categories/:categoryId
DELETE /creators/me/categories/:categoryId
POST   /creators/me/portfolio
PATCH  /creators/me/portfolio/:id
DELETE /creators/me/portfolio/:id

PUT    /brands/me
GET    /brands/me

GET    /categories

POST   /products
GET    /products/me
GET    /products/:id
PATCH  /products/:id

POST   /campaigns
GET    /campaigns/mine
GET    /campaigns                      (solo PUBLISHED, con filtros + paginación)
GET    /campaigns/:id
PATCH  /campaigns/:id
PATCH  /campaigns/:id/status

POST   /applications/campaign/:campaignId   (creador se postula)
POST   /applications/invite                 (marca invita a un creador)
GET    /applications/me
GET    /applications/campaign/:campaignId
PATCH  /applications/:id/status             (marca: shortlist/aceptar/rechazar)
PATCH  /applications/:id/respond            (creador: aceptar/rechazar invitación)
PATCH  /applications/:id/withdraw           (creador: retirar postulación)

GET    /collaborations
GET    /collaborations/:id
PATCH  /collaborations/:id/status

POST   /deliverables
PATCH  /deliverables/:id/submit
PATCH  /deliverables/:id/review
PATCH  /deliverables/:id/publish

POST   /reviews
GET    /reviews/user/:userId           (público, con avgRating)

GET    /favorites                      (marca: creadores guardados, paginado)
GET    /favorites/ids                  (marca: ids guardados, para marcar el ♥ en discovery)
POST   /favorites/:creatorId
DELETE /favorites/:creatorId

POST   /disputes
GET    /disputes/me
PATCH  /disputes/:id/review      (admin)
PATCH  /disputes/:id/resolve     (admin)

POST   /chat/conversations                        (inicia o recupera el thread con counterpartId)
GET    /chat/conversations                         (paginado, con lastMessage + unreadCount)
GET    /chat/conversations/:id/messages             (paginado, orden cronológico)
POST   /chat/conversations/:id/messages             (persiste y hace broadcast por WebSocket)
PATCH  /chat/conversations/:id/read

GET    /admin/dashboard
GET    /admin/users | /creators | /brands | /campaigns | /collaborations | /disputes | /activity
PATCH  /admin/users/:id/status
PATCH  /admin/creators/:id/verify
PATCH  /admin/marketplaces/:id/verify
PATCH  /admin/brands/:id/verify
```

### Chat en tiempo real (WebSocket)

Además de los endpoints REST de arriba (que son la única vía de escritura de mensajes), el servidor expone un namespace Socket.IO en `/chat` sobre el mismo puerto HTTP.

```js
const socket = io('http://localhost:4000/chat', { auth: { token: accessToken } });

socket.emit('conversation:join', { conversationId }, (ack) => {
  // ack = { ok: true } si sos parte de la conversación, { ok: false } si no
});

socket.on('message:new', (message) => { /* nuevo mensaje en una sala que ya joineaste */ });
socket.on('conversation:updated', ({ conversationId }) => { /* refrescá la lista de conversaciones */ });
socket.on('conversation:read', ({ conversationId, readerUserId }) => { /* el otro lado leyó tus mensajes */ });

socket.emit('conversation:leave', { conversationId });
```

- La conexión se autentica con el mismo JWT que la API REST (`auth.token` en el handshake); un token inválido o ausente desconecta el socket inmediatamente.
- `conversation:join` valida ownership server-side (no confía en el cliente) antes de unir el socket a la sala `conversation:<id>`.
- Enviar un mensaje sigue siendo `POST /chat/conversations/:id/messages` — el gateway nunca persiste, solo hace `broadcast` después de que el REST endpoint confirma la escritura, evitando dos caminos de verdad para el mismo dato.

## 17. Flujo de una campaña

```
Marca crea cuenta → Crea perfil → Crea producto → Crea campaña (DRAFT) → Publica (PUBLISHED)

Camino A: Creador descubre y se postula → Marca revisa → Shortlist → Marca acepta
Camino B: Marca busca creadores → Invita → Creador acepta

→ Se crea la Collaboration (transacción atómica, protegida contra duplicados
  y contra exceder `creatorsRequired`)
→ ACCEPTED
→ SAMPLE_PENDING (marca) → SAMPLE_SENT (marca, requiere tracking) → SAMPLE_RECEIVED (creador)
   [o el creador salta directo a CONTENT_IN_PROGRESS si la campaña no requiere envío físico]
→ CONTENT_IN_PROGRESS (creador)
→ DRAFT_SUBMITTED (creador sube borrador del entregable)
→ CHANGES_REQUESTED (marca) ⇄ DRAFT_SUBMITTED  -- o --  FINAL_SUBMITTED (creador, requiere finalUrl)
→ APPROVED (marca, requiere que todos los entregables estén APPROVED)
→ PUBLISHED (creador, requiere publicationUrl en todos los entregables)
→ COMPLETED (marca)
→ Ambas partes pueden calificarse (Review, con `wouldWorkAgain` para marcas)
→ Se recalcula el Creator Passport del creador
```

Cada transición de estado (tanto de `Campaign` como de `Collaboration`) pasa por una máquina de estados explícita (`campaign-state-machine.ts`, `collaboration-state-machine.ts`) que rechaza saltos inválidos (p. ej. `SAMPLE_PENDING → COMPLETED`) y valida qué rol puede ejecutar cada paso. `DISPUTED` solo se entra abriendo una disputa y solo se sale por resolución de un admin.

## 18. Estructura del proyecto

Ver sección 2 (Arquitectura). Cada módulo de dominio sigue el mismo patrón: `*.controller.ts` (rutas + guards de rol), `*.service.ts` (lógica de negocio + ownership + transacciones), `*.dto.ts` (validación estricta con `class-validator`, `whitelist`/`forbidNonWhitelisted` activados globalmente).

## Seguridad implementada

- Passwords con `bcrypt` (12 rounds), nunca expuestos en ninguna respuesta.
- JWT con expiración configurable; `RolesGuard` + `JwtAuthGuard` globales (`@Public()` para excepciones explícitas).
- Verificación de `ownership` en cada servicio, no solo el rol.
- Cuentas `SUSPENDED` no pueden iniciar sesión.
- `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true` — protección contra mass assignment (un cliente no puede setear campos como `reliabilityScore` o `verified` que no están en el DTO).
- Rate limiting global (`@nestjs/throttler`, 120 req/min).
- `helmet` + CORS configurable por entorno.
- Filtro de excepciones global que nunca expone stack traces y traduce errores de Prisma (constraint violado, registro no encontrado, FK inválida) a códigos HTTP correctos.
- No se almacenan documentos de identidad en tablas públicas: la verificación KYC es un campo de estado (`verificationLevel`) pensado para integrarse con un proveedor externo (Priority: siguiente fase), no un lugar para subir documentos directamente.

## Próxima fase (fuera de alcance de este MVP)

- Integración KYC con proveedor externo para verificación de identidad.
- Refresh tokens / rotación de sesión.
- Almacenamiento de archivos vía URLs firmadas (S3/R2) en vez de aceptar URLs arbitrarias.
- Sistema propio de afiliados, tracking de links y comisiones automáticas.
- Wallet y procesamiento de pagos.
- Integración Shopify.
- Soft deletes / auditoría GDPR para `User`.
