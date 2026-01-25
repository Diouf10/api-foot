# Foot API

API REST simple pour gérer des équipes de football.

## Base URL
http://localhost:3000

---

## Routes disponibles

### 1. Récupérer la liste des équipes
**GET** `/teams`

Retourne toutes les équipes disponibles.

#### Réponse – 200 OK
```json
{
  "count": 3,
  "teams": [
    {
      "id": 1,
      "name": "Real Madrid",
      "country": "Spain"
    },
    {
      "id": 2,
      "name": "Manchester City",
      "country": "England"
    }
  ]
}
```

### 🔹 2. Récupérer une équipe par ID
**GET** `/teams/{id}`

Retourne le détail d’une équipe spécifique.

#### 📥 Paramètres

| Nom | Type   | Description             |
| --- | ------ | ----------------------- |
| id  | number | Identifiant de l’équipe |

#### Réponse – 200 OK
```json
{
  "id": 2,
  "name": "Manchester City",
  "country": "England"
}
```

#### Réponse – 404 Not Found
```json
{
  "error": "Team not found"
}
```

### 3. Ajouter une nouvelle équipe
**POST** `/teams`

Ajoute une nouvelle équipe à la liste.

#### Body (JSON)
```json
{
  "name": "FC Barcelona",
  "country": "Spain"
}
```

#### Réponse – 201 Created
```json
{
  "id": 4,
  "name": "FC Barcelona",
  "country": "Spain"
}
```

#### Réponse – 400 Bad Request
```json
{
  "error": "name and country are required"
}
```

### Exemple avec curl
curl -X POST http://localhost:3000/teams \
  -H "Content-Type: application/json" \
  -d '{"name":"AC Milan","country":"Italy"}'


### Lancer avec Docker
docker compose up --build

- L’API sera accessible sur :
👉 http://localhost:3000





