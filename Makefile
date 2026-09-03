.PHONY: install run lint format test check

install:
	python -m pip install -e '.[dev]'

run:
	uvicorn atmosalert.api.app:app --reload

lint:
	ruff check src tests

format:
	ruff format src tests

test:
	pytest

check: lint test
