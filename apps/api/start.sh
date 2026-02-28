#!/bin/sh
echo "=== Starting Application ==="
echo "NODE_ENV: $NODE_ENV"

# Active DB connection check (max 30 seconds)
echo "Waiting for database..."
RETRIES=0
MAX_RETRIES=15
until node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query('SELECT 1')).then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "ERROR: Database not reachable after ${MAX_RETRIES} attempts. Aborting."
    exit 1
  fi
  echo "  Database not ready, retrying ($RETRIES/$MAX_RETRIES)..."
  sleep 2
done
echo "Database is ready."

# Safety check: detect if database has data but knex_migrations is empty
# This prevents destructive re-migration on an existing database
echo "Checking database state..."
TABLES_EXIST=$(node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() =>
  c.query(\"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenants')\")
).then(r => { console.log(r.rows[0].exists ? 'yes' : 'no'); c.end(); })
.catch(() => { console.log('error'); process.exit(0); });
" 2>/dev/null)

MIGRATIONS_EXIST=$(node -e "
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() =>
  c.query(\"SELECT COUNT(*)::int as cnt FROM knex_migrations\")
).then(r => { console.log(r.rows[0].cnt > 0 ? 'yes' : 'no'); c.end(); })
.catch(() => { console.log('no'); process.exit(0); });
" 2>/dev/null)

echo "Tables exist: $TABLES_EXIST, Migrations tracked: $MIGRATIONS_EXIST"

if [ "$TABLES_EXIST" = "yes" ] && [ "$MIGRATIONS_EXIST" = "no" ]; then
  echo "WARNING: Database has tables but knex_migrations is empty!"
  echo "This indicates a corrupted migration state. Skipping migrations to protect data."
  echo "Starting application without migrations..."
  exec node dist/main.js
fi

# Check for pending migrations before running
echo "Checking for pending migrations..."
PENDING=$(node -r ts-node/register -e "
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: { directory: './src/database/migrations', extension: 'ts' }
});
knex.migrate.list().then(([completed, pending]) => {
  console.log(pending.length);
  knex.destroy();
}).catch(() => { console.log('unknown'); process.exit(0); });
" 2>/dev/null)

if [ "$PENDING" = "0" ]; then
  echo "No pending migrations. Database is up to date."
else
  echo "Pending migrations: $PENDING"

  # Use advisory lock to prevent concurrent migrations from multiple replicas
  echo "Running migrations (with advisory lock)..."
  node -r ts-node/register -e "
const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: { directory: './src/database/migrations', extension: 'ts' }
});

async function run() {
  // Acquire advisory lock (key: 1) to prevent concurrent migrations
  const lockResult = await knex.raw('SELECT pg_try_advisory_lock(1) as locked');
  if (!lockResult.rows[0].locked) {
    console.log('Another replica is running migrations. Waiting...');
    // Wait for lock (blocking)
    await knex.raw('SELECT pg_advisory_lock(1)');
  }

  try {
    const [batch, migrations] = await knex.migrate.latest();
    if (migrations.length > 0) {
      console.log('Batch ' + batch + ' run: ' + migrations.length + ' migrations');
      migrations.forEach(m => console.log('  - ' + m));
    } else {
      console.log('Already up to date');
    }
  } finally {
    await knex.raw('SELECT pg_advisory_unlock(1)');
    await knex.destroy();
  }
}

run().then(() => process.exit(0)).catch(e => { console.error('Migration error:', e.message); process.exit(1); });
" 2>&1

  if [ $? -ne 0 ]; then
    echo "ERROR: Migration failed! Aborting startup."
    exit 1
  fi
  echo "Migrations completed successfully."
fi

echo "Starting application..."
exec node dist/main.js
