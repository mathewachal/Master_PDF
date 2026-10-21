.PHONY: install dev build test clean docker-up docker-down

install:
	npm install
	cd apps/api && pip install -r requirements.txt

dev:
	@echo "Starting development servers..."
	npm run dev

dev-api:
	npm run api:dev

test:
	npm run test
	npm run api:test

lint:
	npm run lint
	npm run api:lint

build:
	npm run build

docker-up:
	docker compose up --build

docker-down:
	docker compose down
