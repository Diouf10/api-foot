const express = require("express");
const app = express();
const swaggerUi = require("swagger-ui-express");
const openapi = require("./openapi.json");


app.use(express.json());

let teams = [
  { id: 1, name: "Real Madrid", country: "Spain" },
  { id: 2, name: "Manchester City", country: "England" },
  { id: 3, name: "PSG", country: "France" }
];

// Route 1: GET /teams -> liste des équipes
app.get("/teams", (req, res) => {
  res.json({ count: teams.length, teams });
});

// Route 2: GET /teams/:id -> détail d'une équipe
app.get("/teams/:id", (req, res) => {
  const id = Number(req.params.id);
  const team = teams.find(t => t.id === id);

  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }
  res.json(team);
});

// Route 3: POST /teams -> ajouter une équipe
app.post("/teams", (req, res) => {
  const { name, country } = req.body;

  if (!name || !country) {
    return res.status(400).json({ error: "name and country are required" });
  }

  const newTeam = {
    id: teams.length ? Math.max(...teams.map(t => t.id)) + 1 : 1,
    name,
    country
  };

  teams.push(newTeam);
  res.status(201).json(newTeam);
});

const PORT = process.env.PORT || 3000;

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/openapi.json", (req, res) => res.json(openapi));


app.listen(PORT, () => console.log(`Foot API running on port ${PORT}`));
