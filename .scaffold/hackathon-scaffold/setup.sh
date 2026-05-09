#!/bin/bash
# Hackathon scaffold setup
# Run this on your Mac Mini:  bash setup.sh

set -e

echo "=== Creating Next.js app ==="
npx create-next-app@latest keystone-hackathon \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack

cd keystone-hackathon

echo "=== Installing CopilotKit ==="
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime

echo "=== Installing OpenAI adapter ==="
npm install openai @ai-sdk/openai ai

echo "=== Copying scaffold files ==="
# Copy from the scaffold directory (adjust path as needed)
SCAFFOLD_DIR="$(dirname "$0")"

# Overwrite the generated files with our scaffold
cp -r "$SCAFFOLD_DIR/src/" ./src/
cp "$SCAFFOLD_DIR/.env.local.example" ./.env.local.example
cp "$SCAFFOLD_DIR/HACKATHON_README.md" ./README.md

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. cd keystone-hackathon"
echo "  2. cp .env.local.example .env.local"
echo "  3. Add your API key to .env.local"
echo "  4. npm run dev"
echo "  5. Open http://localhost:3000"
echo ""
echo "Get an API key from one of:"
echo "  - https://platform.openai.com/api-keys (OpenAI)"
echo "  - https://console.anthropic.com/ (Anthropic)"
echo ""
