#!/bin/sh
set -e

CERT_PATH=${SSL_CERT_PATH:-/etc/ssl/private/server.crt}
KEY_PATH=${SSL_KEY_PATH:-/etc/ssl/private/server.key}
SERVER_CN=${SERVER_NAME:-localhost}
LE_CERT_DIR="/etc/letsencrypt/live/${SERVER_CN}"
LE_CERT_FILE="${LE_CERT_DIR}/fullchain.pem"
LE_KEY_FILE="${LE_CERT_DIR}/privkey.pem"

# Ensure target directories exist
mkdir -p "$(dirname "$CERT_PATH")"
mkdir -p "$(dirname "$KEY_PATH")"

# If Let's Encrypt certificate already exists, reuse it.
if [ -n "$SERVER_NAME" ] && [ "$SERVER_NAME" != "_" ] \
  && [ -f "$LE_CERT_FILE" ] && [ -f "$LE_KEY_FILE" ]; then
  echo "Using existing Let's Encrypt certificate for ${SERVER_NAME}."
  cp "$LE_CERT_FILE" "$CERT_PATH"
  cp "$LE_KEY_FILE" "$KEY_PATH"
fi

# Generate a self-signed certificate if nothing is available yet.
if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
  echo "TLS certificate not found. Generating a temporary self-signed certificate for ${SERVER_CN}."
  openssl req -x509 -nodes -newkey rsa:4096 \
    -keyout "$KEY_PATH" \
    -out "$CERT_PATH" \
    -days 30 \
    -subj "/CN=${SERVER_CN}"
fi

chmod 600 "$KEY_PATH"

exec nginx -g 'daemon off;'

