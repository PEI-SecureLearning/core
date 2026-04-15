#!/bin/sh
set -e

# Generate garage.toml from template using environment variables
envsubst < /opt/garage.template.toml > /etc/garage.toml

# Execute the main garage command
exec /garage "$@"
