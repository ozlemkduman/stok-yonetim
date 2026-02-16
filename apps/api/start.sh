#!/bin/sh
echo "Running database migrations..."
npx knex migrate:latest --knexfile knexfile.ts || echo "Migration warning (may already be applied)"
echo "Running database seeds..."
npx knex seed:run --knexfile knexfile.ts || echo "Seed warning (may already be applied)"
echo "Starting application..."
exec node dist/main.js
