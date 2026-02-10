#!/bin/sh
echo "Running database migrations..."
npx knex migrate:latest --knexfile knexfile.ts || echo "Migration warning (may already be applied)"
echo "Starting application..."
exec node dist/main.js
