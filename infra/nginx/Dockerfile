FROM node:20-alpine AS build

WORKDIR /app

COPY key-bar-qr-menu/package*.json ./

RUN npm ci

COPY key-bar-qr-menu/ ./

RUN npm run build

FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

RUN mkdir -p /var/www/certbot \
  && rm /etc/nginx/conf.d/default.conf

ENV SERVER_NAME=_ \
    BACKEND_HOST=backend \
    BACKEND_PORT=3000 \
    SSL_CERT_PATH=/etc/ssl/private/server.crt \
    SSL_KEY_PATH=/etc/ssl/private/server.key \
    ACME_CHALLENGE_ROOT=/var/www/certbot \
    NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template

VOLUME ["/etc/ssl/private", "/etc/letsencrypt", "/var/www/certbot"]

EXPOSE 80 443

