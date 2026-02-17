#!/bin/sh
echo "=== Database Setup ==="
echo "NODE_ENV: $NODE_ENV"
echo "Checking migration files..."
ls dist/database/migrations/ 2>&1 || echo "WARNING: dist/database/migrations/ not found!"
ls src/database/migrations/ 2>&1 || echo "WARNING: src/database/migrations/ not found!"

echo ""
echo "Running database migrations..."
npx knex migrate:latest --knexfile knexfile.ts 2>&1
echo "Migration exit code: $?"

echo ""
echo "Running database seeds..."
npx knex seed:run --knexfile knexfile.ts 2>&1
echo "Seed exit code: $?"

echo ""
echo "Starting application..."
exec node dist/main.js
