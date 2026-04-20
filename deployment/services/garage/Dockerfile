FROM dxflrs/garage:76592723deb9285a071320c40842f6be61e924fd AS garage_bin

FROM alpine:3.20

RUN apk add --no-cache gettext

COPY --from=garage_bin /garage /garage
COPY garage.template.toml /opt/garage.template.toml
COPY init.sh /usr/local/bin/init.sh

ENTRYPOINT ["/bin/sh", "/usr/local/bin/init.sh"]
CMD ["server", "--single-node", "--default-bucket"]
