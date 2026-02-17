#!/bin/sh
echo "=== Database Setup ==="
echo "NODE_ENV: $NODE_ENV"

echo "Running database migrations..."
npx knex migrate:latest --knexfile knexfile.ts 2>&1
echo "Migration exit code: $?"

echo "Running essential seeds (plans + admin)..."
npx knex seed:run --knexfile knexfile.ts --specific=001_plans.seed.js 2>&1
npx knex seed:run --knexfile knexfile.ts --specific=002_super_admin.seed.js 2>&1

echo "Starting application..."
exec node dist/main.js
