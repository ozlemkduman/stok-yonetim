#!/bin/sh
echo "=== Database Setup ==="
echo "NODE_ENV: $NODE_ENV"

# Wait for database to be ready
echo "Waiting for database..."
MAX_RETRIES=30
RETRY_COUNT=0
until node -e "const knex = require('knex')({client:'pg',connection:process.env.DATABASE_URL}); knex.raw('SELECT 1').then(()=>{console.log('DB ready');process.exit(0)}).catch(()=>{process.exit(1)})" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Database not ready after $MAX_RETRIES retries, starting anyway..."
    break
  fi
  echo "Database not ready, retrying in 2s... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "Running database migrations..."
npx knex migrate:latest --knexfile knexfile.ts 2>&1
echo "Migration exit code: $?"

echo "Running essential seeds (plans + admin)..."
npx knex seed:run --knexfile knexfile.ts --specific=001_plans.seed.js 2>&1
npx knex seed:run --knexfile knexfile.ts --specific=002_super_admin.seed.js 2>&1

echo "Starting application..."
exec node dist/main.js
