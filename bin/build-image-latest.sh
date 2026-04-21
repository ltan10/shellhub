#!/bin/sh
SHELLHUB_PATH=$(dirname "$(dirname "$(realpath "$0")")")
cd "$SHELLHUB_PATH" || exit 1

# Use Shellhub ./bin/utils
. "./bin/utils"

MATRIX="cli gateway"
for img in $MATRIX; do
#   docker buildx build --tag $DOCKER_REGISTRY/shellhub-$img:fix-revdial-session-keepalive --push . -f $img/Dockerfile;
  # docker buildx build -t $img:latest -f $img/Dockerfile --load --no-cache .;
  docker buildx build -t "$img:$SHELLHUB_VERSION-latest" -f "$img/Dockerfile" --load "$@" .;
done
