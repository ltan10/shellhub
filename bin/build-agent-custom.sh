#!/bin/sh
SHELLHUB_PATH=$(dirname "$(dirname "$(realpath "$0")")")
cd "$SHELLHUB_PATH" || exit 1

env_override=${ENV_OVERRIDE:-./.env.override}
COMPOSE_ENV_FILES="./.env"
{
    # Disable unbound variable (-u) checking and enable auto-export (-a)
    set +u
    set -a
    # shellcheck source=../.env
    [ -f "$COMPOSE_ENV_FILES" ] && . "${COMPOSE_ENV_FILES}"
    # shellcheck source=../.env.override
    [ -f "$env_override" ] && . "${env_override}"
}

AGENT_VERSION="$SHELLHUB_VERSION-custom"
AGENT_SRC_DIR="$SHELLHUB_PATH/agent"
OUTPUT_DIR="$SHELLHUB_PATH/dist/$SHELLHUB_VERSION"

echo "Agent version: $AGENT_VERSION"
cd "$AGENT_SRC_DIR" || exit 1

echo "Output Dir: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

### SEE SHELLHUB_DIR/agent/build-agent.yml -> jobs.build-agent

# Build matrix
# target = GOOS GOARCH GOARM
TARGETS="
linux arm 6
linux arm 7
linux arm64
linux amd64
linux 386
"

echo "$TARGETS" | while read goos goarch goarm; do
    # skip empty lines
    [ -n "$goos" ] || continue

    BINARY_NAME="shellhub-agent-${goos}-${goarch}"
    if [ -n "${goarm}" ]; then
        BINARY_NAME="${BINARY_NAME}v${goarm}"
    fi

    echo "Building $BINARY_NAME"

    CGO_ENABLED=0 GOOS=$goos GOARCH=$goarch GOARM=$goarm \
        go build \
            -tags installer \
            -ldflags "-s -w -X main.AgentVersion=$AGENT_VERSION" \
            -o "$OUTPUT_DIR/$BINARY_NAME" .

    # must show "statically linked"
    file "$OUTPUT_DIR/$BINARY_NAME" | grep -q "statically linked" || {
        echo "❌ $BINARY_NAME is NOT statically linked"
        exit 1
    }

    gzip -f "$OUTPUT_DIR/$BINARY_NAME"
done

echo "✅ All builds completed"

# Cleanup
# -cache: Wipes the main Go Build Cache (compiled intermediate objects).
# -testcache: Expires and clears all cached Go Test Results.
# -modcache: Deletes the entire Go Module Cache ($GOPATH/pkg/mod),
#       removing all downloaded dependency source files.
# -fuzzcache: Clears out any saved Fuzzing Corpus inputs used during fuzz testing.

go clean -cache
