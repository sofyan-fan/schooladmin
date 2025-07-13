#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Wait for the database to be ready
# This is a simple loop that tries to connect to the database.
# A more robust solution would be to use a tool like wait-for-it.sh
echo "Waiting for database to be ready..."
# We can't use nc (netcat) as it's not in the alpine image by default.
# Instead, we will rely on the docker-compose depends_on feature and add a sleep as a fallback.
sleep 10

# Push the schema to the database.
# The --accept-data-loss flag is used here because this script is for a development environment.
# It will drop and recreate the database if there are schema changes that would cause data loss.
# Do not use this in production.
echo "Pushing database schema..."
npx prisma db push --accept-data-loss

# Run the database seed script.
echo "Seeding database..."
npx prisma db seed

# Execute the main command (e.g., "npm run dev")
exec "$@" 