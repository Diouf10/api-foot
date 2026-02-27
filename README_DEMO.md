# Footo-Stats (Foot API) — Demo Grafana + Docker

## Démarrage
```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## Endpoints utiles
- Health: `GET /health`
- Metrics Prometheus: `GET /metrics`
- Teams: `GET /teams`

## Démo anomalies
- **Panne (HTTP 500)**: `GET /debug/fail?rate=1`
- **Latence**: `GET /debug/slow?ms=2500`
- **Panne totale**: `docker stop api-foot_ready-foot-api-1` (ou le nom du conteneur)

## Setup Grafana (rapide)
1. Add data source → **Prometheus**
   - URL: `http://prometheus:9090`
2. Crée un dashboard avec ces requêtes:
   - Requêtes/s:
     `rate(http_requests_total[1m])`
   - Erreurs 5xx/s:
     `sum(rate(http_requests_total{status=~"5.."}[1m]))`
   - Latence p95:
     `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))`

## Alerting (démo)
Exemple règle:
- Condition: `sum(rate(http_requests_total{status=~"5.."}[1m])) > 0`
- For: 1m
- Contact point: email/discord/webhook
