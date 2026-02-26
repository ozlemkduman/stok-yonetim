#!/bin/sh
echo "=== Starting Application ==="
echo "NODE_ENV: $NODE_ENV"

# Brief wait for database readiness
echo "Waiting for database (3s)..."
sleep 3

# Run migrations - exit if fails to prevent app starting with broken DB
echo "Running migrations..."
npx knex migrate:latest --knexfile knexfile.ts
if [ $? -ne 0 ]; then
  echo "ERROR: Migration failed! Aborting startup."
  exit 1
fi
echo "Migrations completed successfully."

echo "Starting application..."
exec node dist/main.js
