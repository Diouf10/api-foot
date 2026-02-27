const express = require("express");
const swaggerUi = require("swagger-ui-express");
const promClient = require("prom-client");

const APP_VERSION = process.env.VERSION || "dev";

const app = express();
const openapi = require("./openapi.json");

app.use(express.json());

// Logs HTTP lisibles + utiles pour le soutien
const morgan = require("morgan");
app.use(morgan("combined"));

// --- Données mock ---
let teams = [
  { id: 1, name: "Real Madrid", country: "Spain", league: "La Liga" },
  { id: 2, name: "Manchester City", country: "England", league: "Premier League" },
  { id: 3, name: "PSG", country: "France", league: "Ligue 1" }
];

// --- Prometheus metrics ---
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"]
});

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);

// Middleware métriques (route + status + latence)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;

    // route stable (sinon Prometheus explose en cardinalité)
    const route = (req.route && req.route.path) ? req.route.path : req.path;
    const status = String(res.statusCode);

    httpRequestsTotal.labels(req.method, route, status).inc();
    httpRequestDuration.labels(req.method, route, status).observe(durationSec);
  });

  next();
});

// --- Routes de base pour le soutien ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Footo-Stats", version: APP_VERSION,time: new Date().toISOString() });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// --- API ---
app.get("/teams", (req, res) => {
  res.json({ version: APP_VERSION, count: teams.length, teams });
});

app.get("/teams/:id", (req, res) => {
  const id = Number(req.params.id);
  const team = teams.find((t) => t.id === id);

  if (!team) return res.status(404).json({ error: "Team not found" });
  res.json(team);
});

app.post("/teams", (req, res) => {
  const { name, country } = req.body;

  if (!name || !country) {
    return res.status(400).json({ error: "name and country are required" });
  }

  const newTeam = {
    id: teams.length ? Math.max(...teams.map((t) => t.id)) + 1 : 1,
    name,
    country
  };

  teams.push(newTeam);
  res.status(201).json(newTeam);
});

// --- Routes de démo (pour déclencher anomalies) ---
// 1) Génère des 500 facilement
// Exemple: /debug/fail?rate=1 (100% de 500)
app.get("/debug/fail", (req, res) => {
  const rate = Number(req.query.rate ?? "1");
  if (Math.random() < rate) {
    throw new Error("Simulated server failure for demo");
  }
  res.json({ ok: true, message: "No failure this time", rate });
});

// 2) Simule de la latence
// Exemple: /debug/slow?ms=2500
app.get("/debug/slow", async (req, res) => {
  const ms = Number(req.query.ms ?? "1500");
  await new Promise((r) => setTimeout(r, ms));
  res.json({ ok: true, delayedMs: ms });
});

// Swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/openapi.json", (req, res) => res.json(openapi));

// Handler d'erreur (500) -> important pour avoir des métriques 5xx + logs
app.use((err, req, res, next) => {
  console.error("[ERROR]", err?.message ?? err);
  res.status(500).json({ code: "InternalError", message: "Internal server error" });
});


// support
// --- Support -> envoie vers n8n (qui créera le ticket Zammad) ---
app.post("/support-ticket", async (req, res) => {
  try {
    const N8N_URL = process.env.N8N_SUPPORT_WEBHOOK_URL; 
    // ex: http://142.93.156.69:5678/webhook/support-ticket

    if (!N8N_URL) {
      return res.status(500).json({ error: "N8N_SUPPORT_WEBHOOK_URL is not set" });
    }

    const payload = {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
      priority: req.body.priority ?? "P2",
    };

    // Node 18+ a fetch global; sinon npm i node-fetch
    const r = await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return res.status(r.status).json(data);
  } catch (e) {
    console.error("[SUPPORT-TICKET]", e);
    return res.status(500).json({ error: "Failed to forward to n8n" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Foot API running on port ${PORT}`));
