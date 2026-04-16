FROM dxflrs/garage:76592723deb9285a071320c40842f6be61e924fd

# Install envsubst
RUN apk add --no-cache gettext

# Copy the template and init script
COPY garage.template.toml /opt/garage.template.toml
COPY init.sh /usr/local/bin/init.sh

RUN chmod +x /usr/local/bin/init.sh

ENTRYPOINT ["/usr/local/bin/init.sh"]
CMD ["server", "--single-node", "--default-bucket"]
