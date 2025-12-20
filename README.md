# 🏨 API de Réservation d'Hôtel

Backend Node.js + MongoDB pour une plateforme de réservation d'hôtel.

## 📁 Structure

```
No Sql/
├── index.js          → Code principal (connexion, serveur, routes)
├── data/hotels.json  → Fichier JSON pour manipulation
├── package.json      → Dépendances
└── .env              → Variables d'environnement
```

## Installation

```bash
npm install
```

Créer `.env` :
```env
MONGODB_URI=mongodb+srv://sarahadjar01_db_user:admin123@nosql.1c73sso.mongodb.net/hotel
PORT=3000
```

Démarrer :
```bash
npm start
```

##  Routes (18 routes)

### Hôtels (6)
- `POST /api/hotels` → Créer
- `GET /api/hotels` → Lister
- `GET /api/hotels/recherche/avancee` → Recherche avancée
- `PUT /api/hotels/:id` → Modifier
- `DELETE /api/hotels/:id` → Supprimer
- `GET /api/hotels/top/etoiles` → Top 5 (agrégation)

### Chambres (6)
- `POST /api/rooms` → Créer
- `GET /api/rooms` → Lister
- `PUT /api/rooms/:id` → Modifier
- `DELETE /api/rooms/:id` → Supprimer
- `GET /api/rooms/stats/par-type` → Stats
- `GET /api/rooms/plus-reservees` → Plus réservées ($lookup)

### Réservations (6)
- `POST /api/reservations` → Créer
- `GET /api/reservations` → Lister
- `PUT /api/reservations/:id` → Modifier
- `DELETE /api/reservations/:id` → Supprimer
- `GET /api/reservations/stats` → Stats
- `GET /api/reservations/completes` → Complètes ($lookup)

## 📝 Exemples curl

### Hôtels
```bash
# Créer
curl -X POST http://localhost:3000/api/hotels -H "Content-Type: application/json" -d '{"nom":"Hotel Paris","adresse":{"rue":"15 Rue de la Paix","ville":"Paris","codePostal":"75001","pays":"France"},"telephone":"+33123456789","email":"contact@hotel.fr","etoiles":4,"description":"Un bel hotel"}'

# Lister
curl http://localhost:3000/api/hotels
curl "http://localhost:3000/api/hotels?ville=Paris&etoiles=4"

# Recherche avancée
curl "http://localhost:3000/api/hotels/recherche/avancee?ville=Paris&etoilesMin=3&etoilesMax=5"

# Modifier (remplacer ID_HOTEL)
curl -X PUT http://localhost:3000/api/hotels/69357b4e7e8b5ad396f57c87 -H "Content-Type: application/json" -d '{"etoiles":5,"description":"Hotel de luxe"}'

# Supprimer
curl -X DELETE http://localhost:3000/api/hotels/69357b4e7e8b5ad396f57c87

# Top 5
curl http://localhost:3000/api/hotels/top/etoiles
```

### Chambres
```bash
# Créer
curl -X POST http://localhost:3000/api/rooms -H "Content-Type: application/json" -d '{"hotelId":"6935659d629163fcc757ebea","numero":"101","type":"Double","prixNuit":120,"capacite":2}'

# Lister
curl "http://localhost:3000/api/rooms?hotelId=6935659d629163fcc757ebea&type=Double"

# Modifier (remplacer ID_CHAMBRE)
curl -X PUT http://localhost:3000/api/rooms/6935ef3ef4472412d72fde2a -H "Content-Type: application/json" -d '{"prixNuit":150,"disponible":false}'

# Supprimer
curl -X DELETE http://localhost:3000/api/rooms/6935ef3ef4472412d72fde2a

# Stats
curl http://localhost:3000/api/rooms/stats/par-type

# Plus réservées
curl http://localhost:3000/api/rooms/plus-reservees
```

### Réservations
```bash
# Créer
curl -X POST http://localhost:3000/api/reservations -H "Content-Type: application/json" -d '{"hotelId":"6935659d629163fcc757ebea","roomId":"507f1f77bcf86cd799439012","client":{"nom":"Dupont","email":"dupont@example.com","telephone":"+33123456789"},"dateArrivee":"2024-01-15","dateDepart":"2024-01-20","prixTotal":600,"statut":"en_attente"}'

# Lister
curl "http://localhost:3000/api/reservations?statut=confirmee&page=1&limit=10"

# Modifier (remplacer ID_RESERVATION)
curl -X PUT http://localhost:3000/api/reservations/6935ef3ef4472412d72fde2a -H "Content-Type: application/json" -d '{"statut":"confirmee"}'

# Supprimer
curl -X DELETE http://localhost:3000/api/reservations/6935eeadf4472412d72fde29

# Stats
curl http://localhost:3000/api/reservations/stats

# Complètes
curl http://localhost:3000/api/reservations/completes
```

## 💾 Base de données

- **Nom :** `hotel-booking`
- **Collections :** `hotels`, `rooms`, `reservations`
- **Driver :** MongoDB natif (pas Mongoose)
- **Serveur :** HTTP natif (pas Express)

La base et les collections se créent automatiquement au premier insert.
