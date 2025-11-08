#!/bin/sh
set -eu

echo "[entrypoint] Running database migrations..."
node ./scripts/migrate.js

echo "[entrypoint] Starting Fastify server..."
exec node server.js

