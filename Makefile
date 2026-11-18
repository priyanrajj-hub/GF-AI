.PHONY: help build test lint k8s-up docker-up docker-down

help:
	@echo "Ada / GF-AI Institutional Engineering Makefile"
	@echo "  make build       - Build shared package and services"
	@echo "  make test        - Run test suite and coverage"
	@echo "  make lint        - Run linter across codebase"
	@echo "  make k8s-up      - Bootstrap local Kubernetes cluster via kind/k3d and deploy Helm chart"
	@echo "  make docker-up   - Start local dev stack with Docker Compose"
	@echo "  make docker-down - Stop local dev stack"

build:
	npm run build

test:
	npm test

lint:
	npm run lint

k8s-up:
	bash ./tools/dev/k8s-up.sh

docker-up:
	docker compose -f docker-compose.dev.yml up -d

docker-down:
	docker compose -f docker-compose.dev.yml down
