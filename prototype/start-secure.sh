#!/bin/zsh
set -euo pipefail

script_dir="${0:A:h}"
keychain_service="openai-devday-hackathon-20261018"

if ! openai_key=$(security find-generic-password -a "$USER" -s "$keychain_service" -w); then
  echo "OpenAI API key was not found in macOS Keychain." >&2
  exit 1
fi

cd "$script_dir"
OPENAI_API_KEY="$openai_key" exec node server.js

