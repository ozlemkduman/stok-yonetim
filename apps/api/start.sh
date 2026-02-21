#!/bin/sh
echo "=== Starting Application ==="
echo "NODE_ENV: $NODE_ENV"

# Simple DB wait using pg_isready or just sleep
echo "Waiting for database (10s)..."
sleep 10

# Run migrations before starting the app
echo "Running migrations..."
npx knex migrate:latest --knexfile knexfile.ts || echo "Migration warning (non-fatal)"

echo "Starting application..."
exec node dist/main.js
