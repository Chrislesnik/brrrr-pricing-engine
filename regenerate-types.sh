#!/bin/bash

# Regenerate TypeScript types from Supabase database
# Run this after schema migrations

set -e

echo "🔄 Regenerating TypeScript types..."

# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:HHbqYyXoAGOgKetR@db.iufoslzvcjmtgsazttkt.supabase.co:5432/postgres"

# Create types directory if it doesn't exist
mkdir -p src/types

# Generate types using Supabase CLI
cd /tmp && mkdir -p .supabase_types && cd .supabase_types

npx supabase gen types typescript --db-url "$DATABASE_URL" > /Users/aaronkraut/supabase_apps/brrrr-pricing-engine/src/types/database.types.ts

cd /Users/aaronkraut/supabase_apps/brrrr-pricing-engine

echo "✅ TypeScript types generated successfully!"
echo "📄 File: src/types/database.types.ts"
wc -l src/types/database.types.ts
