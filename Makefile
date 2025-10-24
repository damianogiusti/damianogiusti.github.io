
.DEFAULT_GOAL := help


# The 'help' implementation extracts all Makefile targets with comments starting with ##,
# sorts them, and prints a colorized help summary.
help: ## List all available tasks
	@grep -hE '^[A-Za-z0-9_ \.\-]*?:.*##.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

dependencies:  ## Download project dependencies
	@bundle install

start: ## Start the Jekyll development server
	@sleep 3 && open http://localhost:4000 &
	@bundle exec jekyll serve --livereload