FROM woblerr/pgbackrest:2.60.0-alpine@sha256:f9e1e3989ed2d2476827ae6d48b1e41a959cdc2ece9596948b63299461c34c82 AS pgbackrest

FROM postgres:18.6-alpine@sha256:10a5c69a83035ab5239f5620d708520e8b28f5aa1f2b20143e6024532edadfb5

COPY --from=pgbackrest /usr/bin/pgbackrest /opt/pgbackrest/pgbackrest
COPY --from=pgbackrest /usr/lib /opt/pgbackrest/lib

COPY deploy/pgbackrest-entrypoint.sh /usr/local/bin/dosvy-pgbackrest-entrypoint

# pgBackRest writes its absolute executable path into PostgreSQL restore_command.
# These two shared libraries are absent from the PostgreSQL base image, so install
# only the missing runtime libraries in the normal loader path for PITR startup.
RUN cp /opt/pgbackrest/lib/libbz2.so.1.0.8 /usr/lib/libbz2.so.1.0.8 \
  && ln -sf libbz2.so.1.0.8 /usr/lib/libbz2.so.1 \
  && cp /opt/pgbackrest/lib/libssh2.so.1.0.1 /usr/lib/libssh2.so.1.0.1 \
  && ln -sf libssh2.so.1.0.1 /usr/lib/libssh2.so.1 \
  && printf '%s\n' '#!/bin/sh' 'exec env LD_LIBRARY_PATH=/opt/pgbackrest/lib /opt/pgbackrest/pgbackrest "$@"' \
    > /usr/local/bin/pgbackrest \
  && chmod 0755 /usr/local/bin/pgbackrest /usr/local/bin/dosvy-pgbackrest-entrypoint

ENTRYPOINT ["/usr/local/bin/dosvy-pgbackrest-entrypoint"]
CMD ["postgres"]
