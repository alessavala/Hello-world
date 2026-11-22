# Deploy en tu VPS de Hostinger (SSH directo, sin la UI de EasyPanel)

Servidor: **KVM 2, Ubuntu 24.04 con EasyPanel** (`178.16.140.61`). Dominio:
`creatorflow.com.mx`.

Probamos primero el camino "normal" (crear un servicio Compose dentro de
EasyPanel, cargar variables en su pestaña Environment). No funcionó: la
pestaña Environment de ese tipo de servicio (Compose, marcado BETA) nunca
aplicó las variables, y Postgres no arrancaba por falta de contraseña. Esta
guía evita esa pestaña por completo y hace el deploy con `docker compose`
directo por SSH - EasyPanel sigue instalado e intacto, simplemente no lo
usamos para este proyecto en particular.

## 0. DNS

Antes de nada, creá estos registros A apuntando a `178.16.140.61`:

- `creatorflow.com.mx`
- `api.creatorflow.com.mx`

Se hace desde donde tengas el dominio contratado. Puede tardar minutos u
horas en propagar - no bloquea los pasos siguientes, pero sin esto no va a
funcionar el HTTPS al final.

## 1. Conectate por SSH

```bash
ssh root@178.16.140.61
```

## 2. Cloná el proyecto en una carpeta propia

```bash
mkdir -p /opt/creator-flow
cd /opt/creator-flow
git clone https://github.com/alessavala/creator-flow.git .
```

Si el repo es privado y pide credenciales, generá un token en GitHub
(Settings → Developer settings → Personal access tokens → Fine-grained,
con acceso de solo lectura a `alessavala/creator-flow`) y usalo como
contraseña cuando lo pida.

## 3. Creá el archivo con las credenciales

Este archivo vive solo en el servidor, nunca se sube a GitHub:

```bash
cat > .env << 'EOF'
POSTGRES_USER=creator
POSTGRES_PASSWORD=REEMPLAZAR-contraseña-fuerte
POSTGRES_DB=creator_commerce
JWT_SECRET=REEMPLAZAR-con-openssl-rand-hex-32
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://creatorflow.com.mx
API_URL=https://api.creatorflow.com.mx
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Creator Commerce <no-reply@creatorflow.com.mx>
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
EOF
```

Generá los dos valores reales ahí mismo, en el servidor (nunca los pegues en
un archivo que vaya a GitHub):

```bash
openssl rand -hex 20   # para POSTGRES_PASSWORD
openssl rand -hex 32   # para JWT_SECRET
```

Editá el `.env` (`nano .env`) y reemplazá los dos placeholders por esos
valores.

## 4. Publicá los puertos temporalmente (para ver el sitio ya mismo)

Mientras el DNS no haya propagado y no tengamos el dominio andando con
HTTPS, esto te deja ver el sitio por IP:

```bash
cat > docker-compose.override.yml << 'EOF'
services:
  backend:
    ports:
      - "4000:4000"
  frontend:
    ports:
      - "3000:3000"
EOF
```

## 5. Levantá todo

```bash
docker compose -p creatorflow up -d --build
```

La primera vez tarda varios minutos (compila backend y frontend). Esperá a
que vuelva el cursor.

## 6. Verificá

```bash
docker compose -p creatorflow ps
```

Los tres servicios (`postgres`, `backend`, `frontend`) tienen que decir
`running` o `healthy`. Si alguno dice `restarting` o `exited`:

```bash
docker compose -p creatorflow logs --tail=80
```

y revisá el error ahí.

## 7. Mirá el sitio

```
http://178.16.140.61:3000
```

## 8. Pasar a dominio + HTTPS real (una vez que el DNS esté propagado)

1. Sacá el archivo de override (ya no hace falta publicar los puertos):
   ```bash
   rm docker-compose.override.yml
   ```
2. En EasyPanel, creá un servicio tipo **App** (no Compose) para el backend
   y otro para el frontend, apuntando cada uno a este mismo directorio, o
   simplemente agregá los dominios manualmente con un proxy (Caddy/Nginx)
   apuntando a `localhost:4000` y `localhost:3000`. La opción más simple:
   volvé a poner el override del paso 4, pero reemplazando `"4000:4000"` por
   `"127.0.0.1:4000:4000"` (solo accesible desde el propio servidor) y
   configurá Caddy o el proxy de EasyPanel para enrutar
   `creatorflow.com.mx` → `127.0.0.1:3000` y `api.creatorflow.com.mx` →
   `127.0.0.1:4000` con HTTPS automático.
3. Volvé a correr `docker compose -p creatorflow up -d --build` después de
   cualquier cambio.

## 9. Actualizar cuando haya cambios nuevos

```bash
cd /opt/creator-flow
git pull origin main
docker compose -p creatorflow up -d --build
```

## 10. Backups

```bash
docker exec -t creator-flow-postgres-1 \
  pg_dump -U creator creator_commerce > backup-$(date +%F).sql
```

(El nombre exacto del contenedor te lo confirma `docker compose -p
creatorflow ps`.)
