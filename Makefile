PORT ?= 8000

# `make` builds the CSS, keeps rebuilding it on save, and serves the site at http://localhost:$(PORT)
.PHONY: dev build
dev: node_modules
	npm run build
	@echo "Open http://localhost:$(PORT)  (Ctrl+C to stop)"
	@trap 'kill 0' EXIT; npm run watch & python3 -m http.server $(PORT)

build: node_modules
	npm run build

node_modules: package-lock.json
	npm ci
	@touch node_modules
