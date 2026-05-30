#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TypeORM Migration Manager ===${NC}\n"

# Parse .env file properly (handles spaces around =)
export $(grep -v '^#' .env.development | sed 's/ = /=/g' | xargs)

case "${1:-help}" in
  generate)
    echo -e "${BLUE}📝 Generating migration...${NC}"
    TS_NODE_PROJECT=apps/api/tsconfig.app.json \
    npx ts-node -r tsconfig-paths/register \
    ./node_modules/typeorm/cli.js \
    migration:generate apps/api/src/migrations/${2:-NewMigration} \
    -d apps/api/src/data-source.ts
    echo -e "${GREEN}✅ Migration generated!${NC}\n"
    ;;
  
  run)
    echo -e "${BLUE}▶️  Running pending migrations...${NC}"
    TS_NODE_PROJECT=apps/api/tsconfig.app.json \
    npx ts-node -r tsconfig-paths/register \
    ./node_modules/typeorm/cli.js \
    migration:run \
    -d apps/api/src/data-source.ts
    echo -e "${GREEN}✅ Migrations executed!${NC}\n"
    ;;
  
  revert)
    echo -e "${BLUE}⏮️  Reverting last migration...${NC}"
    TS_NODE_PROJECT=apps/api/tsconfig.app.json \
    npx ts-node -r tsconfig-paths/register \
    ./node_modules/typeorm/cli.js \
    migration:revert \
    -d apps/api/src/data-source.ts
    echo -e "${GREEN}✅ Migration reverted!${NC}\n"
    ;;
  
  show)
    echo -e "${BLUE}📋 Showing migration status...${NC}"
    TS_NODE_PROJECT=apps/api/tsconfig.app.json \
    npx ts-node -r tsconfig-paths/register \
    ./node_modules/typeorm/cli.js \
    migration:show \
    -d apps/api/src/data-source.ts
    ;;
  
  verify)
    echo -e "${BLUE}🔍 Verifying tables in database...${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_NAME" -c "\dt"
    echo -e "\n${BLUE}📊 Checking enum types...${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_NAME" -c "\dT+" | grep enum
    ;;
  
  *)
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  generate [MigrationName]  - Generate new migration from entities"
    echo "  run                       - Run pending migrations"
    echo "  revert                    - Revert last migration"
    echo "  show                      - Show migration status"
    echo "  verify                    - Verify tables & enums in database"
    echo ""
    echo "Examples:"
    echo "  $0 generate AddNewFeature"
    echo "  $0 run"
    echo "  $0 verify"
    ;;
esac
