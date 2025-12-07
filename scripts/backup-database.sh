#!/bin/bash
# Database Backup Script for Bad Scandi
#
# Prerequisites:
#   sudo apt install postgresql-client
#
# Usage:
#   ./scripts/backup-database.sh
#
# The script reads DIRECT_URL from .env file

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -E '^DIRECT_URL=' .env | xargs)
fi

if [ -z "$DIRECT_URL" ]; then
  echo "Error: DIRECT_URL not found in .env file"
  echo "Make sure you have DIRECT_URL set (use port 5432, not the pooler)"
  exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/badscandi_backup_$TIMESTAMP.sql"

echo "Starting database backup..."
echo "Backup file: $BACKUP_FILE"

# Run pg_dump
pg_dump "$DIRECT_URL" > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"
COMPRESSED_FILE="$BACKUP_FILE.gz"

# Get file size
SIZE=$(ls -lh "$COMPRESSED_FILE" | awk '{print $5}')

echo "Backup completed successfully!"
echo "File: $COMPRESSED_FILE"
echo "Size: $SIZE"

# Keep only last 7 backups (optional cleanup)
echo ""
echo "Cleaning up old backups (keeping last 7)..."
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm

echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
