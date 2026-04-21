#!/bin/sh
SHELLHUB_PATH=$(dirname "$(dirname "$(realpath "$0")")")
cd "$SHELLHUB_PATH" || exit 1

TENANT_ID="00000000-0000-4000-0000-000000000000"
NAMESPACE_NAME="development"

OWNER=$(./bin/cli user list | awk '$3 == "admin" {print $1; exit 1}')

# ./bin/cli namespace create development admin 00000000-0000-4000-0000-000000000000
./bin/cli namespace create "${NAMESPACE_NAME}" "${OWNER}" "${TENANT_ID}"
