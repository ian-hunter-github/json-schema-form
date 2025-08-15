#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Install with 'brew install jq'"
    exit 1
fi

# Parse arguments
SHOW_HELP=false
NEW_VERSION=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -\?|-h|--help)
            SHOW_HELP=true
            shift
            ;;
        *)
            if [[ -z "$NEW_VERSION" && ! "$1" =~ ^- ]]; then
                NEW_VERSION="$1"
            fi
            shift
            ;;
    esac
done

if $SHOW_HELP; then
    cat <<EOF
Usage: ./version-bump.sh [newVersion] [options]

Options:
  -?, -h, --help    Show this help message
  newVersion    Optional version to set (e.g. 1.2.3), defaults to patch bump

This script will:
1. Update all package.json versions in the monorepo
2. Update inter-dependencies between packages
3. Show a summary of changes made
EOF
    exit 0
fi

# Find all package.json files
PACKAGE_FILES=()
while IFS= read -r -d '' file; do
    PACKAGE_FILES+=("$file")
done < <(find . -name "package.json" -print0)

if [[ ${#PACKAGE_FILES[@]} -eq 0 ]]; then
    echo "Error: No package.json files found"
    exit 1
fi

# Read all packages and their names
declare -A PACKAGE_NAMES
for file in "${PACKAGE_FILES[@]}"; do
    name=$(jq -r '.name' "$file")
    if [[ -n "$name" ]]; then
        PACKAGE_NAMES["$name"]="$file"
    fi
done

# Get current version from root package
ROOT_PKG="./package.json"
if [[ ! -f "$ROOT_PKG" ]]; then
    echo "Error: Could not find root package.json"
    exit 1
fi

CURRENT_VERSION=$(jq -r '.version' "$ROOT_PKG")
if [[ -z "$NEW_VERSION" ]]; then
    # Bump patch version by default
    IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
    NEW_VERSION="${VERSION_PARTS[0]}.${VERSION_PARTS[1]}.$((VERSION_PARTS[2] + 1))"
elif [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version format '$NEW_VERSION'. Use semver format (e.g. 1.2.3)"
    exit 1
fi

echo "Updating all packages to version $NEW_VERSION"
echo

# Check if versions already exist in npm registry
CONFLICTS=()
for file in "${PACKAGE_FILES[@]}"; do
    PKG_NAME=$(jq -r '.name' "$file")
    if [[ -n "$PKG_NAME" ]]; then
        if npm view "${PKG_NAME}@${NEW_VERSION}" --json &>/dev/null; then
            CONFLICTS+=("$PKG_NAME@$NEW_VERSION")
        fi
    fi
done

if [[ ${#CONFLICTS[@]} -gt 0 ]]; then
    echo "Error: The following package versions already exist in npm registry:"
    printf ' - %s\n' "${CONFLICTS[@]}"
    echo "Aborting version bump to avoid conflicts"
    exit 1
fi

# Update versions and dependencies
CHANGES=()
for file in "${PACKAGE_FILES[@]}"; do
    CHANGED=false
    PKG_NAME=$(jq -r '.name' "$file")
    DIR_NAME=$(basename "$(dirname "$file")")
    CURRENT_PKG_VERSION=$(jq -r '.version' "$file")

    # Update package version
    if [[ "$CURRENT_PKG_VERSION" != "$NEW_VERSION" ]]; then
        CHANGES+=("- $DIR_NAME: version $CURRENT_PKG_VERSION → $NEW_VERSION")
        jq --arg newVersion "$NEW_VERSION" '.version = $newVersion' "$file" > "$file.tmp"
        mv "$file.tmp" "$file"
        CHANGED=true
    fi

    # Update dependencies
    for DEP_TYPE in dependencies devDependencies peerDependencies; do
        DEPS=$(jq -r ".${DEP_TYPE} // {} | keys[]" "$file" 2>/dev/null)
        for DEP in $DEPS; do
            if [[ -n "${PACKAGE_NAMES[$DEP]}" ]]; then
                CURRENT_DEP_VERSION=$(jq -r ".${DEP_TYPE}.\"$DEP\"" "$file")
                if [[ "$CURRENT_DEP_VERSION" != "^$NEW_VERSION" ]]; then
                    CHANGES+=("- $DIR_NAME: ${DEP_TYPE}.$DEP $CURRENT_DEP_VERSION → ^$NEW_VERSION")
                    jq --arg dep "$DEP" --arg newVersion "^$NEW_VERSION" \
                       ".${DEP_TYPE}.\$dep = \$newVersion" "$file" > "$file.tmp"
                    mv "$file.tmp" "$file"
                    CHANGED=true
                fi
            fi
        done
    done

    if $CHANGED; then
        # Format the JSON with 2-space indentation
        jq '.' "$file" > "$file.tmp"
        mv "$file.tmp" "$file"
    fi
done

# Output summary
if [[ ${#CHANGES[@]} -gt 0 ]]; then
    echo "Changes made:"
    printf '%s\n' "${CHANGES[@]}"
    echo
    echo "Successfully updated ${#CHANGES[@]} version references across ${#PACKAGE_FILES[@]} packages"
else
    echo "No version changes needed - all packages already up to date"
fi
