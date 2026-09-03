#!/bin/sh

SHELLHUB_PATH=$(dirname "$(dirname "$(realpath "$0")")")
cd "$SHELLHUB_PATH" || exit 1

gateway_container=$(./bin/docker-compose ps -q "gateway")
gateway_container_name=$(docker inspect -f '{{.Name}}' "$gateway_container" | sed 's|^/||')
docker cp "./gateway/nginx/conf.d/shellhub.conf" "$gateway_container_name:/templates/conf.d/"

api_container=$(./bin/docker-compose ps -q "api")
api_container_name=$(docker inspect -f '{{.Name}}' "$api_container" | sed 's|^/||')
docker cp "./install.sh" "$api_container_name:/templates/"
