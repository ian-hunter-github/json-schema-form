#!/bin/bash

# Set directories (macOS compatible)
ROOT_DIR=$(cd "$(dirname "$(dirname "$0")")" && pwd)
DIST_DIR="$ROOT_DIR/dist"
STYLES_DIR="$ROOT_DIR/src/styles"
BASE_DIR="$STYLES_DIR/base"
THEME_OUT_DIR="$DIST_DIR/styles"

# Create output directories
mkdir -p "$THEME_OUT_DIR/base"

# Copy base files
if [ -d "$BASE_DIR" ]; then
  for file in "$BASE_DIR"/*.css; do
    if [ -f "$file" ]; then
      cp "$file" "$THEME_OUT_DIR/base/"
      echo "[INFO] Copied base CSS $(basename "$file") → dist/styles/base/$(basename "$file")"
    fi
  done
fi

# Copy theme files
if [ -d "$STYLES_DIR" ]; then
  for file in "$STYLES_DIR"/*.css; do
    if [ -f "$file" ] && [[ $(basename "$file") != _* ]]; then
      cp "$file" "$THEME_OUT_DIR/"
      echo "[INFO] Copied theme $(basename "$file") → dist/styles/$(basename "$file")"
    fi
  done
fi

# Make script executable
chmod +x "$0"
