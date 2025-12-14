FROM rabbitmq:3.11.23-management

# Copy initialization script
COPY init-users.sh /scripts/init-users.sh

# Make the script executable
RUN chmod +x /scripts/init-users.sh

# Set the entrypoint to use the init script
ENTRYPOINT ["/bin/bash", "/scripts/init-users.sh"]
