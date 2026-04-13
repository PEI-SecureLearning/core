FROM mongo:4.4.6

# Copy initialization script and templates
COPY init.js /docker-entrypoint-initdb.d/init.js
COPY templates/ /docker-entrypoint-initdb.d/templates/
