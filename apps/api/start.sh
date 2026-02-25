#!/bin/sh
echo "=== Starting Application ==="
echo "NODE_ENV: $NODE_ENV"

# Simple DB wait using pg_isready or just sleep
echo "Waiting for database (10s)..."
sleep 10

# Run migrations
echo "Running migrations..."
npx knex migrate:latest --knexfile knexfile.js
echo "Migrations completed."

echo "Starting application..."
exec node dist/main.js
