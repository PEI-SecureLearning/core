FROM rabbitmq:3.11.23-management

# Copy configuration and initialization files
COPY definitions.template.json /etc/rabbitmq/definitions.template.json
COPY init.sh /scripts/init.sh

# Configure RabbitMQ to load definitions on startup and make init script executable
RUN apt-get update && apt-get install -y --no-install-recommends gettext-base && \
    rm -rf /var/lib/apt/lists/* && \
    chmod +x /scripts/init.sh && \
    echo "management.load_definitions = /etc/rabbitmq/definitions.json" >> /etc/rabbitmq/rabbitmq.conf && \
    rabbitmq-plugins enable --offline rabbitmq_prometheus

# Health check to ensure RabbitMQ is ready
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD rabbitmq-diagnostics -q ping

# Set the entrypoint
ENTRYPOINT ["/scripts/init.sh"]
