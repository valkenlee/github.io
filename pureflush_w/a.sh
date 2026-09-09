#!/bin/bash

# Target file
FILE="index.html"

# File check
if [ ! -f "$FILE" ]; then
    echo "Error: $FILE file not found!"
    exit 1
fi

# Extract current version line (e.g., window.JS_VER = "0.10.11";)
CURRENT_LINE=$(grep -E 'window\.JS_VER\s*=\s*"[0-9]+\.[0-9]+\.[0-9]+"' "$FILE")

if [ -z "$CURRENT_LINE" ]; then
    echo "Error: window.JS_VER pattern not found in $FILE"
    exit 1
fi

# Extract full version string (e.g., 0.10.11)
CURRENT_VER=$(echo "$CURRENT_LINE" | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')

# Separate version into MAJOR, MINOR, PATCH
MAJOR=$(echo "$CURRENT_VER" | cut -d'.' -f1)
MINOR=$(echo "$CURRENT_VER" | cut -d'.' -f2)
PATCH=$(echo "$CURRENT_VER" | cut -d'.' -f3)

# Increment PATCH version by 1
NEW_PATCH=$((PATCH + 1))
NEW_VER="${MAJOR}.${MINOR}.${NEW_PATCH}"

# Replace version string in index.html (works across Linux/macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS sed
    sed -i '' -E "s/(window\.JS_VER\s*=\s*\")$CURRENT_VER(\";)/\1$NEW_VER\2/" "$FILE"
else
    # Linux sed
    sed -i -E "s/(window\.JS_VER\s*=\s*\")$CURRENT_VER(\";)/\1$NEW_VER\2/" "$FILE"
fi

echo "Updated JS_VER: $CURRENT_VER -> $NEW_VER"

