# DeMol - Molecular Model Exporter

DeMol is a comprehensive platform for working with molecular models, offering powerful tools for exporting, visualization, and data storage. The system supports a wide range of molecular formats (PDB, MMTF, CIF, XYZ, SDF, MOL2, CDJSON), provides 3D visualization using Three.js, and integrates with decentralized IPFS storage. DeMol delivers a complete infrastructure for scientific research in molecular modeling with comprehensive monitoring, scalability, and high-performance data processing.

<div align="center">
  <img src="docs/images/demol-architecture.svg" alt="DeMol Architecture" width="700">
</div>

## Features

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <h3>🧪 Export Molecular Models</h3>
        <p>Seamless export of complex molecular structures</p>
      </td>
      <td align="center" width="33%">
        <h3>📊 Multiple Format Support</h3>
        <p>Work with all major molecular file formats</p>
      </td>
      <td align="center" width="33%">
        <h3>🔗 IPFS Integration</h3>
        <p>Decentralized storage for molecular data</p>
      </td>
    </tr>
    <tr>
      <td align="center">
        <h3>🔬 3D Visualization</h3>
        <p>Interactive Three.js rendering</p>
      </td>
      <td align="center" colspan="2">
        <h3>📁 Supported Formats</h3>
        <p>
          <code>PDB</code> &bull;
          <code>MMTF</code> &bull;
          <code>CIF</code> &bull;
          <code>XYZ</code> &bull;
          <code>SDF</code> &bull;
          <code>MOL2</code> &bull;
          <code>CDJSON</code>
        </p>
      </td>
    </tr>
  </table>
</div>

## System Architecture

<div align="center">
  <img src="docs/images/system-architecture.svg" alt="System Architecture" width="800">
</div>

### Core Components
  <div align="center">
    <img src="docs/images/ipfs-storage.svg" alt="IPFS Storage Layer" width="500">
  </div>
  
  <div align="center">
    <img src="docs/images/model-parser.svg" alt="Molecular Model Parser" width="500">
  </div>
  
  <div align="center">
    <img src="docs/images/visualization-engine.svg" alt="3D Visualization Engine" width="500">
  </div>

### Infrastructure Requirements
- Node.js (v18+)
- NPM or Yarn
- Docker and Docker Compose (for local services)
- Browser with WebGL support (for visualization)
- Git
- Grafana & Prometheus (for local monitoring)
- Redis (for caching)
- PostgreSQL (for persistent storage)
- IPFS node (for decentralized storage)

<div align="center">
  <img src="docs/images/infrastructure.svg" alt="Infrastructure Overview" width="800">
</div>

## Prerequisites

### System Requirements
- CPU: 4+ cores
- RAM: 16GB+ (32GB recommended)
- Storage: 50GB+ SSD
- Network: 100Mbps+ connection
- OS: Ubuntu 22.04 LTS or macOS 13+, Windows 10/11

### Required Software

1. **Basic Tools**
   ```bash
   # Windows
   # Install Git from https://git-scm.com/download/win
   # Install Node.js from https://nodejs.org/
   # Install WSL2 for a better development experience
   wsl --install -d Ubuntu
   
   # macOS
   brew update
   brew install git node@18
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install -y git curl
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Node.js and npm**
   ```bash
   # Check installation
   node -v  # Should be version 18 or higher
   npm -v   # Should be version 8 or higher
   
   # For installing specific Node.js version using nvm
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   # Restart terminal or run:
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   
   # Install Node.js v18
   nvm install 18
   nvm use 18
   ```

3. **Docker and Container Tools**
   ```bash
   # Windows/macOS
   # Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
   # Make sure to enable Kubernetes in Docker Desktop settings
   
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   # Log out and log back in for group changes to take effect
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Database Setup**
   ```bash
   # Install PostgreSQL
   # Windows: Download from https://www.postgresql.org/download/windows/
   
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Ubuntu/Debian
   sudo apt install -y postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # Create database and user
   sudo -u postgres psql -c "CREATE USER demol WITH PASSWORD 'demol';"
   sudo -u postgres psql -c "CREATE DATABASE demol OWNER demol;"
   ```

5. **Monitoring Tools**
   ```bash
   # Install Grafana & Prometheus using Docker
   # Clone the monitoring configuration
   git clone https://github.com/Decentralized-mols/DeMol-monitoring.git
   cd DeMol-monitoring
   
   # Start the monitoring stack
   docker-compose -f docker-compose.monitoring.yml up -d
   
   # Access Grafana at http://localhost:3000
   # Default credentials: admin/admin
   ```

6. **IPFS Node Setup**
   ```bash
   # Install IPFS
   # Windows: Download from https://dist.ipfs.tech/kubo/
   
   # macOS
   brew install ipfs
   
   # Linux
   wget https://dist.ipfs.tech/kubo/v0.16.0/kubo_v0.16.0_linux-amd64.tar.gz
   tar -xvzf kubo_v0.16.0_linux-amd64.tar.gz
   cd kubo
   sudo bash install.sh
   
   # Initialize and start IPFS
   ipfs init
   ipfs daemon &
   ```

7. **Development Tools**
   ```bash
   # Install global npm packages for development
   npm install -g typescript ts-node nodemon
   
   # Install additional tools
   npm install -g concurrently
   npm install -g prettier
   npm install -g eslint
   
   # Install nvm completion (optional)
   curl -o ~/.nvm-completion.bash https://raw.githubusercontent.com/nvm-sh/nvm/master/bash_completion
   echo 'source ~/.nvm-completion.bash' >> ~/.bashrc  # or ~/.zshrc for Zsh
   ```

## Installation Process

### 1. Clone Repository and Setup Environment
```bash
# Clone repository
git clone https://github.com/Decentralized-mols/DeMol.git
cd DeMol

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file in any text editor

# Initialize Git hooks
npx husky install
```

### 2. Local Development Setup
```bash
# Start development server
npm run dev

# In a separate terminal, start the local IPFS node if not already running
ipfs daemon

# Check application health
# Open in browser: http://localhost:3000
# or run:
curl http://localhost:3000/health
```

### 3. Docker Development Environment
```bash
# Build and start Docker containers with development configuration
docker-compose -f docker-compose.dev.yml up -d

# Check running containers
docker-compose -f docker-compose.dev.yml ps

# Run tests in Docker environment
docker exec -it demol-app npm test

# Access logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop containers
docker-compose -f docker-compose.dev.yml down
```

### 4. Advanced Configuration with Monitoring
```bash
# Start the complete development stack with monitoring
docker-compose -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d

# Import pre-configured Grafana dashboards
cd scripts
./import-dashboards.sh

# Access Grafana dashboards at http://localhost:3000
# Default credentials: admin/admin

# Configure Prometheus data source in Grafana if not automatically added
# URL: http://prometheus:9090
```

### 5. Building and Testing Production-Ready Deployment
```bash
# Build production Docker image
docker build -t demol:prod -f Dockerfile.prod .

# Test production deployment locally
docker-compose -f docker-compose.prod.yml up -d

# Run performance tests against production deployment
npm run perf

# Generate production documentation
npm run docs:prod

# Stop production containers
docker-compose -f docker-compose.prod.yml down
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Basic Configuration
NODE_ENV=development
PORT=3000
DEBUG=true

# IPFS Configuration (local development)
IPFS_NODE_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080/ipfs/

# Database Configuration
DB_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=demol
POSTGRES_USER=demol
POSTGRES_PASSWORD=demol

# Redis Configuration (local caching)
CACHE_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring Configuration
METRICS_ENABLED=true
PROMETHEUS_METRICS_PATH=/metrics
GRAFANA_URL=http://localhost:3000

# Development Settings
API_RATE_LIMIT=0
LOG_LEVEL=debug
CORS_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Docker Environment Configuration

For local development with Docker, use the following configuration in `docker-compose.dev.yml`:

```yaml
version: '3.8'
services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    container_name: demol-app
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DB_TYPE=postgres
      - POSTGRES_HOST=db
      - CACHE_ENABLED=true
      - REDIS_HOST=redis
      - METRICS_ENABLED=true
    depends_on:
      - db
      - redis
      - ipfs
    command: npm run dev
    
  db:
    image: postgres:14-alpine
    container_name: demol-db
    environment:
      - POSTGRES_USER=demol
      - POSTGRES_PASSWORD=demol
      - POSTGRES_DB=demol
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demol"]
      interval: 10s
      timeout: 5s
      retries: 5
      
  redis:
    image: redis:7-alpine
    container_name: demol-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      
  ipfs:
    image: ipfs/kubo:latest
    container_name: demol-ipfs
    ports:
      - "5001:5001" # API
      - "8080:8080" # Gateway
    volumes:
      - ipfs_data:/data/ipfs

volumes:
  postgres_data:
  redis_data:
  ipfs_data:
```

### Monitoring Setup

For local monitoring with Grafana and Prometheus, use the following configuration in `docker-compose.monitoring.yml`:

```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: demol-prometheus
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - monitoring
      
  grafana:
    image: grafana/grafana:latest
    container_name: demol-grafana
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: demol-node-exporter
    ports:
      - "9100:9100"
    networks:
      - monitoring
      
networks:
  monitoring:
    driver: bridge
    
volumes:
  prometheus_data:
  grafana_data:
```

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reloading
npm run dev

# Start development with additional debug info
DEBUG=demol:* npm run dev

# Run development with monitoring dashboard
npm run dev:monitoring

# Build the project
npm run build

# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Run linting
npm run lint

# Automatically fix linting issues
npm run lint:fix

# Check TypeScript types
npm run type-check

# Generate API documentation
npm run docs

# Run security audit
npm audit

# Run performance tests
npm run perf

# Create new molecular model
npm run create-model

# Run examples
npm run examples
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check API health
curl http://localhost:3000/health

# Check local database
# For SQLite
ls -la ./data/database.sqlite

# For PostgreSQL
psql -h localhost -U demol -d demol -c "SELECT 1"

# Check Docker containers
docker ps

# View logs
npm run logs
# or
docker logs demol-app
```

### Local Monitoring with Grafana
```bash
# Start Grafana and Prometheus
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin

# Import DeMol dashboard
curl -X POST -H "Content-Type: application/json" -d @monitoring/grafana/dashboards/demol-dashboard.json http://admin:admin@localhost:3000/api/dashboards/db

# Check Prometheus metrics directly
curl http://localhost:9090/metrics
```

### Local Backup and Recovery
```bash
# Backup SQLite database
cp ./data/database.sqlite ./data/database.sqlite.backup

# Backup PostgreSQL database
pg_dump -h localhost -U demol -d demol > ./backups/demol-backup-$(date +%Y%m%d).sql

# Backup configuration files
cp .env .env.backup

# Backup Docker volumes
./scripts/backup-volumes.sh

# Restore from backup
./scripts/restore-backup.sh ./backups/demol-backup-20230101.sql
```

### Debugging
```bash
# Run with debugging
npm run debug

# View real-time logs
npm run logs:watch

# Check application status
npm run status

# Profile application performance
npm run profile

# Analyze bundle size
npm run analyze
```