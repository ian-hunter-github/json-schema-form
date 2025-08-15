#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Install with 'brew install jq'"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed"
    exit 1
fi

# Parse arguments
SHOW_HELP=false
AUTO_CONFIRM=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -\?|-h|--help)
            SHOW_HELP=true
            shift
            ;;
        -y|--yes)
            AUTO_CONFIRM=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

if $SHOW_HELP; then
    cat <<EOF
Usage: ./publish-packages.sh [options]

Options:
  -?, -h, --help    Show this help message
  -y, --yes         Skip confirmation prompt

This script will:
1. Verify git status is clean
2. Check package versions against npm registry
3. Build and publish all packages
EOF
    exit 0
fi

# Find package.json files (root, packages/*)
PACKAGE_FILES=()
while IFS= read -r -d '' file; do
    PACKAGE_FILES+=("$file")
done < <(find packages/* -maxdepth 1 -name "package.json" -print0)

if [[ ${#PACKAGE_FILES[@]} -eq 0 ]]; then
    echo "Error: No package.json files found in packages directory"
    exit 1
fi

# Check git status first
if ! command -v git &> /dev/null; then
    echo "Error: git is required but not installed"
    exit 1
fi

echo "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    echo "Error: Git working directory is not clean. Commit or stash changes first."
    exit 1
fi

# Check remote git status
git fetch
if ! git rev-parse --abbrev-ref @{u} &>/dev/null; then
    echo "Error: No upstream branch configured for current branch."
    echo "To fix this:"
    echo "1. First set upstream: git push --set-upstream origin $(git branch --show-current)"
    echo "2. Then pull latest changes: git pull"
    exit 1
fi

LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [[ "$LOCAL" != "$REMOTE" ]]; then
    echo "Error: Local branch is not in sync with remote. Pull changes first."
    exit 1
fi
echo "✓ Git status is clean and up-to-date"

# Check package versions against npm registry
echo
echo "Checking package versions against npm registry..."
CONFLICTS=()
PUBLISH_LIST=()

for file in "${PACKAGE_FILES[@]}"; do
    PKG_NAME=$(jq -r '.name' "$file")
    PKG_VERSION=$(jq -r '.version' "$file")
    DIR_NAME=$(basename "$(dirname "$file")")
    
    if [[ -z "$PKG_NAME" || "$PKG_NAME" == "null" ]]; then
        echo "Error: Missing package name in $file"
        exit 1
    fi

    if [[ "$PKG_VERSION" == "null" || ! "$PKG_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]]; then
        echo "Error: Invalid version '$PKG_VERSION' in $file"
        exit 1
    fi

    if npm view "${PKG_NAME}@${PKG_VERSION}" --json &>/dev/null; then
        CONFLICTS+=("$PKG_NAME@$PKG_VERSION")
    else
        PUBLISH_LIST+=("$DIR_NAME: $PKG_NAME@$PKG_VERSION")
    fi
done

if [[ ${#CONFLICTS[@]} -gt 0 ]]; then
    echo
    echo "Error: The following package versions already exist in npm registry:"
    printf ' - %s\n' "${CONFLICTS[@]}"
    echo "Please update versions before publishing"
    exit 1
fi

echo "✓ All package versions are available for publishing"
echo
echo "Packages to be published:"
printf ' - %s\n' "${PUBLISH_LIST[@]}"

# Confirm with user before proceeding unless auto-confirm is set
if ! $AUTO_CONFIRM; then
    echo
    read -p "About to publish ${#PUBLISH_LIST[@]} packages. Continue? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Publish cancelled"
        exit 0
    fi
fi

# Build and publish packages
echo
echo "Building and publishing packages..."
for file in "${PACKAGE_FILES[@]}"; do
    PKG_NAME=$(jq -r '.name' "$file")
    PKG_VERSION=$(jq -r '.version' "$file")
    DIR_NAME=$(basename "$(dirname "$file")")
    
    echo
    echo "➡️ Processing $DIR_NAME ($PKG_NAME@$PKG_VERSION)"
    
    # Build package
    echo "Building package..."
    cd "$(dirname "$file")" || exit 1
    if ! npm run build; then
        echo "Error: Build failed for $PKG_NAME"
        exit 1
    fi
    
    # Publish package
    echo "Publishing to npm..."
    if ! npm publish; then
        echo "Error: Publish failed for $PKG_NAME"
        exit 1
    fi
    
    echo "✓ Successfully published $PKG_NAME@$PKG_VERSION"
    cd - > /dev/null || exit 1
done

echo
echo "✅ Successfully published ${#PUBLISH_LIST[@]} packages to npm"
