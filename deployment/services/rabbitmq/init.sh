#!/bin/bash
set -e

# Render the definitions template with environment variables
envsubst < /etc/rabbitmq/definitions.template.json > /etc/rabbitmq/definitions.json

# Start RabbitMQ in the foreground
exec rabbitmq-server
