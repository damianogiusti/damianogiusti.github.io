
.DEFAULT_GOAL := help


# The 'help' implementation extracts all Makefile targets with comments starting with ##,
# sorts them, and prints a colorized help summary.
help: ## List all available tasks
	@grep -hE '^[A-Za-z0-9_ \.\-]*?:.*##.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

dependencies: ## Install build dependencies
	@npm install

build: ## Build the static site into dist/
	@node build.mjs

start: ## Build and serve locally with live preview
	@node build.mjs && (sleep 1 && open http://localhost:3000 &) && npx -y serve dist
