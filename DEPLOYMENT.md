# Docker Deployment Guide

This document explains how to run the Key Bar stack (Fastify + React + PostgreSQL) in Docker with Nginx acting as a reverse proxy and TLS termination.

## 1. Prerequisites

- Docker Engine 24+ and Docker Compose v2
- Domain name pointing to your server’s public IP (required for trusted TLS)
- Open ports `80` and `443` on the firewall
- PostgreSQL client (optional, for manual maintenance)

## 2. Repository structure for deployment

```
backend/                Fastify API
infra/
  nginx/                Nginx + React multi-stage build
  certs/                Place TLS cert/key here (self-signed or from CA)
key-bar-qr-menu/        React frontend source
docker-compose.yml      Orchestrates all services
DEPLOYMENT.md           This guide
```

## 3. Configure environment variables

### 3.1 Backend

Create `backend/.env` based on the provided template:

```bash
cp backend/env.example backend/.env
```

Update the values as needed. At a minimum set:

```
PORT=3000
DB_HOST=db
DB_PORT=5432
DB_USER=<secure user>
DB_PASSWORD=<secure password>
DB_NAME=keybar
JWT_SECRET=<long random string>
ADMIN_USERNAME=<initial admin login>
ADMIN_PASSWORD=<initial admin password>
```

### 3.2 Compose-level

Create a `.env` file in the project root to drive `docker-compose.yml`:

```
DB_NAME=keybar
DB_USER=keybar
DB_PASSWORD=super-secure-password
SERVER_NAME=menu.example.com
LETSENCRYPT_EMAIL=admin@example.com
SSL_CERT_PATH=/etc/ssl/private/server.crt
SSL_KEY_PATH=/etc/ssl/private/server.key
```

> The `SERVER_NAME` value must match your public DNS record.

## 4. SSL certificate options

### 4.1 Long-lived self-signed certificate (staging/testing)

```
openssl req -x509 -nodes -newkey rsa:4096 \
  -keyout infra/certs/server.key \
  -out infra/certs/server.crt \
  -days 3650 \
  -subj "/CN=${SERVER_NAME}"
```

Self-signed certificates are not trusted by browsers, but they work for internal environments.

### 4.2 Let’s Encrypt (trusted HTTPS)

1. Ensure DNS for `SERVER_NAME` points to this server and ports 80/443 are open.
2. Start only the web stack so HTTP challenges can be served:
   ```bash
   docker compose up -d web backend db
   ```
3. Request the certificate (one-time):
   ```bash
   docker compose run --rm certbot
   ```
4. Reload Nginx to pick up the issued certificate:
   ```bash
   docker compose exec web nginx -s reload
   ```
5. Schedule automatic renewals on the host (runs twice daily):
   ```bash
   echo "0 3,15 * * * cd /path/to/KeyBar && docker compose run --rm certbot renew && docker compose exec web nginx -s reload" | sudo tee /etc/cron.d/keybar-cert-renew
   sudo chmod 644 /etc/cron.d/keybar-cert-renew
   ```

Certificates are stored in the persistent `letsencrypt` volume and private keys in `infra/certs/`.

## 5. Build and run the stack

1. Build images:
   ```bash
   docker compose build
   ```
2. Start containers in the background:
   ```bash
   docker compose up -d
   ```
3. Verify services:
   ```bash
   docker compose ps
   docker compose logs -f backend
   docker compose logs -f web
   ```

Access the site at `https://SERVER_NAME/`. API requests are proxied to the `backend` service via `/api/*`.

## 6. Data persistence

- `postgres-data` volume: PostgreSQL data files
- `backend-uploads` volume: uploaded menu images (mounted to `/usr/src/app/uploads`)
- `letsencrypt` & `certbot-www` volumes: certificate data and ACME challenges
- `infra/certs/`: bind-mounted directory for TLS keys (keep backups safe)

To migrate existing uploads into the Docker volume, copy files once the stack is running:

```bash
docker compose cp backend/uploads/. backend:/usr/src/app/uploads
```

## 7. Useful commands

| Action | Command |
| --- | --- |
| Scale API horizontally | `docker compose up -d --scale backend=2` (adjust Nginx upstream first) |
| Inspect PostgreSQL | `docker compose exec db psql -U $DB_USER -d $DB_NAME` |
| Tail backend logs | `docker compose logs -f backend` |
| Rebuild frontend after UI changes | `docker compose build web && docker compose up -d web` |
| Stop stack | `docker compose down` |
| Stop and remove persistent volumes (danger) | `docker compose down -v` |

## 8. Hardening checklist

- Rotate `JWT_SECRET`, `DB_PASSWORD`, and admin credentials after initial deployment
- Set up database backups (pg_dump or managed service)
- Enable firewall rules to restrict database access to internal network
- Monitor certificate renewal cron logs (`/var/log/syslog` or systemd journal)
- Configure observability (e.g., attach Prometheus/Grafana or a log shipper)

---

Your stack is now containerised, reverse-proxied by Nginx, and ready for long-term HTTPS operation.

