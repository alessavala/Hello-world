# Deploy en tu VPS de Hostinger con EasyPanel

Esta guía es para tu servidor actual: **KVM 2, Ubuntu 24.04 con EasyPanel**
(`178.16.140.61`). Es distinta de `DEPLOYMENT.md` (esa asume Caddy manejando
los puertos 80/443 directamente) porque EasyPanel ya corre su propio proxy
(Traefik) en esos puertos - así que acá usamos `docker-compose.easypanel.yml`,
que no incluye Caddy y deja que EasyPanel maneje los dominios y el HTTPS.

## 0. Antes de arrancar

Necesitás poder crear registros DNS tipo A para:

- `tudominio.com` (o el subdominio que uses para el frontend) → `178.16.140.61`
- `api.tudominio.com` (para el backend) → `178.16.140.61`

Se hace desde donde tengas contratado el dominio (puede ser el propio
Hostinger si lo compraste ahí). EasyPanel pide el certificado HTTPS
(Let's Encrypt) automáticamente cuando agregás el dominio a un servicio, así
que el DNS tiene que estar resolviendo antes de ese paso.

## 1. Crear el proyecto en EasyPanel

1. Entrá a EasyPanel (el botón "Gestionar panel" que ya tenés, o
   `https://178.16.140.61:3000` si te pide la URL directa).
2. Creá un **Project** nuevo, por ejemplo `creator-commerce`.

## 2. Crear el servicio "Compose"

1. Dentro del proyecto, agregá un servicio de tipo **App → Compose**
   (o "Docker Compose", según la versión del panel).
2. Como **Source**, apuntá al repo de GitHub:
   `https://github.com/alessavala/Hello-world`, rama
   `claude/creator-commerce-backend-audit-km5zeh`.
   - Si el repo es privado, EasyPanel te va a pedir conectar tu cuenta de
     GitHub o un token de acceso.
3. Como **archivo de compose**, indicá `docker-compose.easypanel.yml` (no el
   `docker-compose.prod.yml` - ese trae Caddy y va a chocar con el proxy de
   EasyPanel).

## 3. Variables de entorno

En la pestaña **Environment** de ese servicio Compose, cargá:

```
POSTGRES_USER=creator
POSTGRES_PASSWORD=una-contraseña-fuerte-random
POSTGRES_DB=creator_commerce
JWT_SECRET=generalo-con-openssl-rand-hex-32
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tudominio.com
API_URL=https://api.tudominio.com
```

Opcionales (dejalos vacíos si no los usás todavía - el proyecto funciona
sin ellos, ver los READMEs de cada carpeta para más detalle):

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Creator Commerce <no-reply@tudominio.com>
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

Para generar el `JWT_SECRET`, por SSH:

```bash
ssh root@178.16.140.61
openssl rand -hex 32
```

## 4. Deploy

Guardá y ejecutá **Deploy**. La primera vez tarda varios minutos: EasyPanel
buildea las imágenes de `backend` y `frontend` (compila TypeScript de los dos
proyectos) y levanta Postgres.

## 5. Dominios

Una vez que los tres servicios (`postgres`, `backend`, `frontend`) figuren
como corriendo:

1. Andá al servicio **backend** dentro de ese proyecto Compose → pestaña
   **Domains** → agregá `api.tudominio.com` apuntando al puerto de
   contenedor **4000**. EasyPanel emite el certificado HTTPS solo.
2. Andá al servicio **frontend** → **Domains** → agregá `tudominio.com`
   apuntando al puerto de contenedor **3000**.

## 6. Verificar

- `https://tudominio.com` → tiene que cargar la landing.
- `https://api.tudominio.com/api/docs` → Swagger de la API.

Si el certificado no se emite, la causa casi siempre es que el DNS todavía
no propagó - esperá unos minutos y reintentá desde la pestaña Domains.

## 7. Actualizar cuando haya cambios nuevos

Con el repo conectado, EasyPanel suele ofrecer **redeploy automático** al
detectar un push a la rama configurada (activalo en la config del servicio),
o podés apretar **Deploy** manualmente desde el panel cada vez que haya
código nuevo en `claude/creator-commerce-backend-audit-km5zeh`.

## 8. Backups

Tu plan ya muestra "Snapshots y backups: 2" a nivel de todo el VPS - eso
cubre un desastre total del servidor, pero no reemplaza un backup específico
de la base de datos. Recomendado, un dump periódico desde la terminal de
EasyPanel (o por SSH) del contenedor `postgres`:

```bash
docker exec -t <nombre-del-contenedor-postgres> \
  pg_dump -U creator creator_commerce > backup-$(date +%F).sql
```

El nombre exacto del contenedor te lo muestra EasyPanel en la vista del
servicio `postgres` (o `docker ps` por SSH).
