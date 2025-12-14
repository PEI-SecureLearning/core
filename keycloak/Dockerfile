FROM quay.io/keycloak/keycloak:26.4

# Switch to root to install packages
USER root

# Install curl for healthchecks
RUN microdnf install -y curl && microdnf clean all

# Switch back to keycloak user
USER keycloak

# Copy configuration files
COPY conf/keycloak.conf /opt/keycloak/conf/keycloak.conf

# Copy themes
COPY themes /opt/keycloak/themes

# Copy realm imports
COPY imports /opt/keycloak/data/import

# Copy providers (custom extensions)
COPY providers /opt/keycloak/providers

# Set entrypoint command
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
