### 1. Start Monitoring Stack

```bash
docker compose -f docker-compose.monitoring.yaml up -d
```

### 2. Verify Services

Check all containers are running:

```bash
docker ps
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`

- **Prometheus**: http://localhost:9090
- **Loki**: http://localhost:3100

### Start Backend

```bash
cd ph_backend
pnpm dev
```

## Viewing Data in Grafana

### View Metrics

1. Go to http://localhost:3001
2. Navigate to Dashboards > NodeJS Application Dashboard
3. Select `localhost:5000` from the Instance dropdown

### View Logs

1. Go to http://localhost:3001
2. Click Explore in the left sidebar
3. Select Loki datasource
4. Use query: `{app="PharamaCare"}`

## Stop Monitoring Stack

```bash
docker compose -f docker-compose.monitoring.yaml down
```

## Restart Services

```bash
docker compose -f docker-compose.monitoring.yaml restart
```