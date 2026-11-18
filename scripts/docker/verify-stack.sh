#!/usr/bin/env bash
# ==============================================================================
# GF-AI Docker Stack Validation Script
# ==============================================================================
set -euo pipefail

echo "=================================================="
echo "GF-AI Docker Stack Architecture Verification"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
  echo "⚠️ Docker is not available in current host PATH. Validating file schemas..."
  node scripts/docker/verify_docker_compose.mjs
  exit 0
fi

echo "Validating docker-compose.yml configuration..."
POSTGRES_PASSWORD=test_secret JWT_SECRET=test_jwt_secret_min_32_characters_1234 REFRESH_SECRET=test_refresh_secret_min_32_characters_5678 \
  docker compose -f docker-compose.yml config --quiet

echo "Validating docker-compose.dev.yml configuration..."
POSTGRES_PASSWORD=test_secret JWT_SECRET=test_jwt_secret_min_32_characters_1234 REFRESH_SECRET=test_refresh_secret_min_32_characters_5678 \
  docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet

echo "✅ Docker Compose stack configurations verified successfully."
