# Deployment Documentation

This directory contains Docker Compose configurations and deployment files for running the fullstack application in both development and production environments.

## 🏗️ Structure

```
deployment/
├── docker-compose.yml        # Production configuration
├── docker-compose.dev.yml    # Development configuration
├── .env.prod.example         # Production env template
├── .env.dev.example          # Development env template
├── nginx.mednat.conf         # Nginx reverse proxy configuration
└── README.md                 # This file
```

## 🐳 Docker Architecture

The application uses a **multi-container architecture** with Docker Compose:

```
                        ┌──────────────────────────────┐
                        │  Nginx / Edge Proxy          │
                        │  - Serves frontend           │
                        │  - Proxies /api and /kc      │
                        └───────┬───────────────┬──────┘
                                │               │
                         ┌──────▼──────┐ ┌──────▼──────┐
                         │  Frontend   │ │  Keycloak   │
                         │   (React)   │ │   (IAM)     │
                         └──────┬──────┘ └─────────────┘
                                │
                    ┌───────────▼───────────┐   ┌───────────────┐
                    │         API           │◄─►│    Garage     │
                    │      (FastAPI)        │   │  object store │
                    └───────┬─────────┬─────┘   └───────────────┘
                            │         │      (Frontend consumes asset URLs) 
               ┌────────────▼┐   ┌────▼──────────┐      
               │ PostgreSQL  │   │ MongoDB       │      
               │ relational  │   │ templates etc │      
               └─────────────┘   └───────────────┘      
                            │                            
                 ┌──────────▼──────────┐                 
                 │ RabbitMQ + SMTP     │                 
                 │ async email sending │                 
                 └─────────────────────┘                 
                                                         
                                            
```

### Services

1. **nginx**: Edge reverse proxy for the production stack. Terminates HTTP/TLS, serves the built frontend, and routes `/api` to FastAPI and `/kc` to Keycloak.
2. **frontend**: React application. In production it is built into a static site served behind nginx; in development it runs with the dev server.
3. **api**: FastAPI backend. Handles application logic, local JWT validation, tenant management, campaign logic, and integrations with storage, queues, and Keycloak.
4. **keycloak**: Identity and access management service. Issues JWTs, manages realms, clients, users, and authorization-related data.
5. **db**: PostgreSQL database for relational application data and the Keycloak database.
6. **mongo**: MongoDB storage for templates and other document-style content.
7. **garage**: S3-compatible object storage used for content and tenant logos.
8. **rabbitmq**: Message broker used for asynchronous email workflows.
9. **smtp**: Email worker/consumer that processes RabbitMQ jobs and sends emails.

## 🎯 Deployment Configurations

### Production (`docker-compose.yml`)

**Use this for:**
- Production deployments
- Testing the full stack together
- Staging environments

**What it does:**
- Builds all services from source
- Configures Nginx as reverse proxy
- Sets up database with persistent storage
- Manages inter-service networking

### Development (`docker-compose.dev.yml`)

**Use this for:**
- Local development
- Running the full stack locally
- Fast iteration with dev Dockerfiles and mounted source volumes

**What it does:**
- Runs the full development stack
- Exposes service ports directly to the host
- Uses development-specific env values

## 🚀 Quick Start

### Production Deployment

```bash
# Navigate to deployment directory
cd deployment

# Start all services
docker compose --env-file .env.prod -f docker-compose.yml up -d --build

# View logs
docker compose --env-file .env.prod -f docker-compose.yml logs -f

# Stop all services
docker compose --env-file .env.prod -f docker-compose.yml down
```

Access the application:
- **Frontend**: `https://mednat.ieeta.pt:9071/app`
- **API Docs**: `https://mednat.ieeta.pt:9071/api/docs`
- **Keycloak**: `https://mednat.ieeta.pt:9071/kc`

### Development Deployment

```bash
# Start the development stack
cd deployment
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
```

Access the development services:
- **Frontend**: `http://localhost:5173`
- **API Docs**: `http://localhost:8000/docs`
- **Keycloak**: `http://localhost:8080`
- **PostgreSQL**: `localhost:5432`

## ⚙️ Environment Variables

### Deployment Env Files

Copy the desired example env into a .env:

```bash
deployment/.env
```

Templates:

```bash
deployment/.env.dev.example
deployment/.env.prod.example
```

### Production Best Practices

**Never use default passwords in production!**

## 🔧 Nginx Configuration

The `nginx.conf` file configures:

### 1. **Reverse Proxy**
Routes API requests to the backend:
```
/api/*       → backend (FastAPI)
/openapi.json → backend
/health      → backend
```

### 2. **Static File Serving**
Serves React frontend from `/usr/share/nginx/html`

### 3. **Client-Side Routing**
All non-API requests fall back to `index.html` for React Router/TanStack Router

### 4. **Security Headers**
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Enables XSS filter

### 5. **Rate Limiting**
- Limits API requests to 10 per second per IP
- Allows bursts up to 20 requests
- Prevents DoS attacks

### 6. **Performance**
- Gzip compression for text files
- Request buffering
- Connection pooling

## 📝 Docker Compose Files Explained

### Production Configuration

```yaml
services:
  db:
    image: postgres:18-alpine      # Lightweight PostgreSQL
    environment:                   # Database credentials
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydatabase
    volumes:
      - db_data:/var/lib/postgresql/data  # Persistent storage

  api:
    build: ../api                  # Build from API Dockerfile
    environment:                   # Connect to database
      POSTGRES_SERVER: db          # Use service name
      # ... other env vars
    depends_on:
      - db                         # Start DB first

  web:
    build: ../web                  # Build from Web Dockerfile
    ports:
      - "80:80"                    # Expose to host
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro  # Mount config
    depends_on:
      - api                        # Start API first

volumes:
  db_data:                         # Named volume for data persistence
```

### Development Configuration

```yaml
services:
  db:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydatabase
    ports:
      - "5432:5432"                # Expose to host for local dev
    volumes:
      - db_data:/var/lib/postgresql/data
```

## 🛠️ Common Commands

### Building Services

```bash
# Build all services
docker compose build

# Build specific service
docker compose build api

# Build with no cache (fresh build)
docker compose build --no-cache
```

### Starting Services

```bash
# Start in foreground (see logs)
docker compose up

# Start in background (detached)
docker compose up -d

# Start specific service
docker compose up db

# Rebuild and start
docker compose up --build
```

### Stopping Services

```bash
# Stop services (keeps containers)
docker compose stop

# Stop and remove containers
docker compose down

# Stop, remove containers, and delete volumes
docker compose down -v
```

### Viewing Logs

```bash
# All services
docker compose logs

# Follow logs (real-time)
docker compose logs -f

# Specific service
docker compose logs api

# Last 100 lines
docker compose logs --tail=100
```

### Executing Commands

```bash
# Run command in a service
docker compose exec api bash

# Run database commands
docker compose exec db psql -U myuser -d mydatabase

```

### Health Checks

```bash
# Check service status
docker compose ps

# Check API health
curl http://localhost/health

# Check database connection
docker compose exec db pg_isready -U myuser
```

## 🔍 Troubleshooting

### Port Already in Use

**Error**: `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solutions**:
```bash
# Option 1: Stop local PostgreSQL
brew services stop postgresql  # macOS
sudo systemctl stop postgresql # Linux

# Option 2: Change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 on host
```

### Cannot Connect to Database

**Check 1**: Is the database running?
```bash
docker compose ps db
```

**Check 2**: Are credentials correct?
```bash
# Inside API container
docker compose exec api env | grep POSTGRES
```

**Check 3**: Is the database ready?
```bash
docker compose logs db
# Look for "database system is ready to accept connections"
```

### API Not Responding

**Check 1**: Is the API running?
```bash
docker compose logs api
```

**Check 2**: Check for errors:
```bash
docker compose logs api --tail=50
```

**Check 3**: Restart the API:
```bash
docker compose restart api
```

### Frontend Shows 404

**Check 1**: Is Nginx configured correctly?
```bash
docker compose exec web cat /etc/nginx/nginx.conf
```

**Check 2**: Are files built?
```bash
docker compose exec web ls /usr/share/nginx/html
```

**Check 3**: Rebuild the frontend:
```bash
docker compose build web
docker compose up -d web
```

### Database Data Persistence

**List volumes**:
```bash
docker volume ls | grep template-project
```

**Inspect volume**:
```bash
docker volume inspect template-project_db_data
```

**Backup database**:
```bash
docker compose exec db pg_dump -U myuser mydatabase > backup.sql
```

**Restore database**:
```bash
docker compose exec -T db psql -U myuser mydatabase < backup.sql
```

## 🚢 Production Deployment Checklist

### Before Deployment

- [ ] Set strong database password in `.env`
- [ ] Review and update CORS origins in `api/src/main.py`
- [ ] Set `NODE_ENV=production` for frontend
- [ ] Configure domain name in Nginx (if using custom domain)
- [ ] Set up SSL/TLS certificates (use Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up backup strategy
- [ ] Enable monitoring and logging
- [ ] Review security headers
- [ ] Test rate limiting

### SSL/TLS Setup (Production)

For HTTPS, update `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Mount certificates:
```yaml
web:
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro  # Add this
```

### Environment-Specific Configuration

Use the matching env file for each stack:

```bash
cd deployment
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.yml up -d --build
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Monitor all services
watch -n 5 'docker compose ps'

# Monitor resource usage
docker stats

# Check disk usage
docker system df
```

### Log Management

```bash
# Rotate logs
docker compose logs > logs-$(date +%Y%m%d).txt

# Clean old logs
docker compose down
docker compose up -d
```

### Database Maintenance

```bash
# Vacuum database
docker compose exec db vacuumdb -U myuser -d mydatabase

# Reindex database
docker compose exec db reindexdb -U myuser -d mydatabase
```

## 🎓 Learning Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## 💡 Advanced Topics

### Horizontal Scaling

To run multiple API instances:

```yaml
api:
  build: ../api
  deploy:
    replicas: 3  # Run 3 instances
  # ... rest of config
```

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml myapp

# Scale service
docker service scale myapp_api=5
```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          docker compose build
          docker compose up -d
```

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use secrets management** - Docker secrets or external vault
3. **Regular updates** - Keep images up to date
4. **Network isolation** - Use internal networks
5. **Resource limits** - Set memory and CPU limits
6. **Read-only filesystems** - Where possible
7. **Non-root users** - Run containers as non-root
8. **Security scanning** - Use tools like Trivy

Example with resource limits:

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```
