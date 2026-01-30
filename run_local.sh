#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/backend"

if [ -f ".venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source ".venv/bin/activate"
fi

exec uv run python main.py
