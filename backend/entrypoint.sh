#!/bin/sh

set -e

echo "Waiting for Postgres..."
# Wait for DB to be reachable
until pg_isready -h "$DB_HOST" -U "$DB_USER"; do
  sleep 1
done

echo "Postgres is up!"

echo "Applying Django migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec "$@"
