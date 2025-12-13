#!/bin/bash
set -e

# Start RabbitMQ in the background
rabbitmq-server &

# Wait for RabbitMQ to be ready
echo "Waiting for RabbitMQ to start..."
until rabbitmqctl status &>/dev/null; do
  sleep 2
done

echo "RabbitMQ started. Creating users..."

# Create API publisher user
echo "Creating API publisher user: ${RABBITMQ_API_USER}"
rabbitmqctl add_user "${RABBITMQ_API_USER}" "${RABBITMQ_API_PASS}" 2>/dev/null || rabbitmqctl change_password "${RABBITMQ_API_USER}" "${RABBITMQ_API_PASS}"
# API user: can configure and write (publish) - needs read for queue binding
rabbitmqctl set_permissions -p / "${RABBITMQ_API_USER}" ".*" ".*" ".*"

# Create SMTP consumer user
echo "Creating SMTP consumer user: ${RABBITMQ_SMTP_USER}"
rabbitmqctl add_user "${RABBITMQ_SMTP_USER}" "${RABBITMQ_SMTP_PASS}" 2>/dev/null || rabbitmqctl change_password "${RABBITMQ_SMTP_USER}" "${RABBITMQ_SMTP_PASS}"
# SMTP user: can read (consume) - needs some write for ack
rabbitmqctl set_permissions -p / "${RABBITMQ_SMTP_USER}" ".*" ".*" ".*"

echo "RabbitMQ users configured successfully."

# Bring RabbitMQ back to foreground
wait
