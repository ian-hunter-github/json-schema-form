#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Install with 'brew install jq'"
    exit 1
fi

# Parse arguments
SHOW_HELP=false
NEW_VERSION=""
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
            if [[ -z "$NEW_VERSION" && ! "$1" =~ ^- ]]; then
                NEW_VERSION="$1"
            fi
            shift
            ;;
    esac
done

# Find package.json files (root, packages/*)
PACKAGE_FILES=()
while IFS= read -r -d '' file; do
    PACKAGE_FILES+=("$file")
done < <(find . packages/* -maxdepth 1 -name "package.json" -print0)

if [[ ${#PACKAGE_FILES[@]} -eq 0 ]]; then
    echo "Error: No package.json files found"
    exit 1
fi

# First collect all package versions
VERSION_MISMATCH=false
ROOT_VERSION=""
VERSION_PLAN=()
HAS_INVALID_VERSIONS=false

for file in "${PACKAGE_FILES[@]}"; do
    version=$(jq -r '.version' "$file")
    if [[ "$version" == "null" || ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]]; then
        if [[ "$file" != "./package.json" ]]; then
            echo "Error: Invalid version '$version' in $file"
            exit 1
        fi
        HAS_INVALID_VERSIONS=true
        VERSION_PLAN+=("$file:null")
        continue
    fi
    
    VERSION_PLAN+=("$file:$version")
    
    # Set ROOT_VERSION from first valid package
    if [[ -z "$ROOT_VERSION" ]]; then
        ROOT_VERSION="$version"
    elif [[ "$ROOT_VERSION" != "$version" ]]; then
        VERSION_MISMATCH=true
    fi
done

if $HAS_INVALID_VERSIONS; then
    echo "Warning: Some packages have null/missing versions"
fi

if $VERSION_MISMATCH; then
    echo "Warning: Package versions are not identical across the monorepo"
fi

if [[ -z "$ROOT_VERSION" ]]; then
    echo "Error: No valid package versions found to use as base"
    exit 1
fi

# Calculate new versions
if [[ -z "$NEW_VERSION" ]]; then
    # Handle version bump with optional prerelease
    if [[ "$ROOT_VERSION" =~ ^([0-9]+\.[0-9]+\.[0-9]+)(-[a-zA-Z]+\.([0-9]+))?$ ]]; then
        BASE_VERSION="${BASH_REMATCH[1]}"
        PRERELEASE="${BASH_REMATCH[2]}"
        PRERELEASE_NUM="${BASH_REMATCH[3]}"
        
        if [[ -n "$PRERELEASE" ]]; then
            # Bump prerelease number
            NEW_VERSION="${BASE_VERSION}${PRERELEASE%.*}.$((PRERELEASE_NUM + 1))"
        else
            # Standard patch bump
            IFS='.' read -ra VERSION_PARTS <<< "$BASE_VERSION"
            NEW_VERSION="${VERSION_PARTS[0]}.${VERSION_PARTS[1]}.$((VERSION_PARTS[2] + 1))"
        fi
    else
        echo "Error: Could not parse version '$ROOT_VERSION'"
        exit 1
    fi
elif [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ ]]; then
    echo "Error: Invalid version format '$NEW_VERSION'. Use semver format (e.g. 1.2.3)"
    exit 1
fi

# Display version change plan
echo "Version Change Plan:"
for entry in "${VERSION_PLAN[@]}"; do
    file="${entry%%:*}"
    version="${entry#*:}"
    echo "  ${file}: ${version} → $NEW_VERSION"
done
echo

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

# Already moved to beginning of script

# Read all packages and their names
PACKAGE_NAMES=()
PACKAGE_FILES_LIST=()
for file in "${PACKAGE_FILES[@]}"; do
    name=$(jq -r '.name' "$file")
    if [[ -n "$name" ]]; then
        PACKAGE_NAMES+=("$name")
        PACKAGE_FILES_LIST+=("$file")
    fi
done

# ROOT_PKG already defined earlier

# Check git status first
if ! command -v git &> /dev/null; then
    echo "Error: git is required but not installed"
    exit 1
fi

# Check local git status
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

echo "Updating all packages to version $NEW_VERSION"
echo

# Confirm with user before proceeding unless auto-confirm is set
if ! $AUTO_CONFIRM; then
    read -p "About to update versions to $NEW_VERSION. Continue? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Version bump cancelled"
        exit 0
    fi
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
            # Check if dependency is in our package list
            FOUND=false
            for i in "${!PACKAGE_NAMES[@]}"; do
                if [[ "${PACKAGE_NAMES[$i]}" == "$DEP" ]]; then
                    FOUND=true
                    CURRENT_DEP_VERSION=$(jq -r ".${DEP_TYPE}.\"$DEP\"" "$file")
                    break
                fi
            done
            if $FOUND; then
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
