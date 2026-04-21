#!/bin/sh
# Load uncompressed Docker image
# docker load -i myapp.tar

# Load gzip-compressed Docker image
# gunzip -c myapp.tar.gz | docker load

# Alternative for .tar.gz
# zcat myapp.tar.gz | docker load

set -eu

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

OUTPUT_DIR="$SHELLHUB_PATH/dist"
echo "Shellhub version: $SHELLHUB_VERSION"
echo "Output Dir: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# MATRIX="cli gateway"
MATRIX="api"
for img in $MATRIX; do
  image_name="$img:$SHELLHUB_VERSION-custom"
  tar_file_name="$img-$SHELLHUB_VERSION-custom.tar"

  # docker buildx build --tag $DOCKER_REGISTRY/shellhub-$img:fix-revdial-session-keepalive --push . -f $img/Dockerfile;
  # docker buildx build --tag $img:latest -f $img/Dockerfile --load --no-cache .;
  docker buildx build \
    --tag "$img:$SHELLHUB_VERSION-custom" \
    -f "$img/Dockerfile" --load "$@" .;

  docker save -o "$OUTPUT_DIR/$tar_file_name" "$image_name"

  # gzip -f "$OUTPUT_DIR/$tar_file_name"
done


