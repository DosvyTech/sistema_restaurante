#!/bin/sh
set -eu

if [ ! -r /run/secrets/pgbackrest_config ]; then
  echo "pgBackRest configuration secret is unavailable" >&2
  exit 1
fi

mkdir -p /etc/pgbackrest
install -o postgres -g postgres -m 0600 /run/secrets/pgbackrest_config /etc/pgbackrest/pgbackrest.conf
exec /usr/local/bin/docker-entrypoint.sh "$@"
