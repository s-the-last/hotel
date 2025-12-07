# 🏨 API de Réservation d'Hôtel

Bonjour ! Ceci est mon projet de backend pour une plateforme de réservation d'hôtel. J'ai utilisé Node.js et MongoDB comme demandé dans le cours.

## 📐 Comment j'ai organisé mon projet

J'ai mis tout mon code dans un seul fichier `index.js` pour que ce soit simple. Voici la structure :

```
No Sql/
├── index.js          → Tout mon code est là-dedans
├── data/             → Un dossier pour les fichiers JSON
│   └── hotels.json   → J'écris aussi dans ce fichier JSON
├── package.json      → Les dépendances que j'utilise
└── .env              → Mes variables d'environnement (MongoDB, PORT)
```

J'ai tout mis dans `index.js` parce que c'est plus simple pour moi de tout voir au même endroit.

---

## 🔌 Comment ça fonctionne dans mon index.js

Je vais vous expliquer comment j'ai fait, étape par étape :

### 1. Les imports que j'utilise

Au début de mon fichier, j'importe ce dont j'ai besoin :

```javascript
import http from 'http';                    // Pour créer mon serveur
import { MongoClient, ObjectId } from 'mongodb';  // Pour parler à MongoDB
import dotenv from 'dotenv';                // Pour lire le fichier .env
import { readFileSync, writeFileSync } from 'fs';  // Pour lire/écrire dans les fichiers JSON
```

J'utilise `http` natif de Node.js, pas Express, parce que le cours demande d'utiliser le serveur HTTP natif. C'est un peu plus long à écrire mais j'apprends mieux comme ça.

### 2. Ma configuration

Ensuite je configure le port et l'URL de MongoDB :

```javascript
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking';
```

Si je n'ai pas de fichier `.env`, ça utilise les valeurs par défaut.

### 3. Ma connexion à MongoDB

Pour me connecter à MongoDB, j'utilise le driver natif (pas Mongoose) :

```javascript
const client = new MongoClient(MONGODB_URI);
let db, hotels, rooms, reservations;

(async () => {
  try {
    await client.connect();
    console.log('✅ MongoDB connecté');
    db = client.db('hotel-booking');
    hotels = db.collection('hotels');
    rooms = db.collection('rooms');
    reservations = db.collection('reservations');
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err.message);
    process.exit(1);
  }
})();
```

J'ai appris que si la base de données n'existe pas, MongoDB la crée automatiquement ! C'est pratique.

### 4. Mon serveur HTTP

Pour créer mon serveur, j'utilise `http.createServer()` :

```javascript
const server = http.createServer(async (req, res) => {
  // Je gère CORS manuellement
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Je vérifie l'URL et la méthode pour savoir quelle route appeler
  if (url === '/api/hotels' && method === 'GET') {
    // Ma logique ici
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur sur http://localhost:${PORT}`);
});
```

## 🛣️ Mes routes 


### 🏠 Route 0: La page d'accueil

**GET `/`** → Juste pour dire bonjour
- Quand on va sur `http://localhost:3000/`, ça affiche un message de bienvenue

```bash
curl http://localhost:3000/
```

---

### 🏨 Routes pour les hôtels (6 routes)

1. **POST `/api/hotels`** → Créer un hôtel
   - C'est ma route pour ajouter un nouvel hôtel dans la base
   - Je vérifie que l'email est valide avec une regex (j'ai appris ça)
   - J'écris aussi dans le fichier `data/hotels.json` pour la manipulation JSON
   
   ```bash
   curl -X POST http://localhost:3000/api/hotels \
     -H "Content-Type: application/json" \
     -d '{
       "nom": "Hôtel Paris",
       "adresse": {
         "rue": "15 Rue de la Paix",
         "ville": "Paris",
         "codePostal": "75001",
         "pays": "France"
       },
       "telephone": "+33123456789",
       "email": "contact@hotel.fr",
       "etoiles": 4,
       "description": "Un bel hôtel"
     }'
   ```

2. **GET `/api/hotels`** → Voir tous les hôtels
   - Je peux filtrer par ville, étoiles, et faire de la pagination
   
   ```bash
   # Sans filtres
   curl http://localhost:3000/api/hotels
   
   # Avec filtres
   curl "http://localhost:3000/api/hotels?ville=Paris&etoiles=4&page=1&limit=10"
   ```

3. **GET `/api/hotels/recherche/avancee`** → Recherche avancée
   - C'est ma route de lecture avancée (obligatoire pour le projet)
   - Je peux chercher par ville et par nombre d'étoiles (min et max)
   
   ```bash
   curl "http://localhost:3000/api/hotels/recherche/avancee?ville=Paris&etoilesMin=3&etoilesMax=5"
   ```

4. **PUT `/api/hotels/:id`** → Modifier un hôtel
   - Je peux changer les infos d'un hôtel existant
   - Il faut mettre l'ID de l'hôtel dans l'URL
   
   ```bash
   curl -X PUT http://localhost:3000/api/hotels/6935659d629163fcc757ebea \
     -H "Content-Type: application/json" \
     -d '{"etoiles": 5, "description": "Hôtel de luxe"}'
   ```

5. **DELETE `/api/hotels/:id`** → Supprimer un hôtel
   - Je supprime un hôtel de la base
   
   ```bash
   curl -X DELETE http://localhost:3000/api/hotels/6935659d629163fcc757ebea
   ```

6. **GET `/api/hotels/top/etoiles`** → Top 5 hôtels par étoiles
   - C'est ma route d'agrégation (obligatoire)
   - J'utilise `$group` et `$sort` pour grouper les hôtels par nombre d'étoiles
   
   ```bash
   curl http://localhost:3000/api/hotels/top/etoiles
   ```

### 🛏️ Routes pour les chambres (6 routes)

7. **POST `/api/rooms`** → Créer une chambre
   - J'ajoute une chambre liée à un hôtel
   
   ```bash
   curl -X POST http://localhost:3000/api/rooms \
     -H "Content-Type: application/json" \
     -d '{
       "hotelId": "6935659d629163fcc757ebea",
       "numero": "101",
       "type": "Double",
       "prixNuit": 120,
       "capacite": 2
     }'
   ```

8. **GET `/api/rooms`** → Voir toutes les chambres
   - Je peux filtrer par hôtel, type, prix, disponibilité
   
   ```bash
   curl "http://localhost:3000/api/rooms?hotelId=6935659d629163fcc757ebea&type=Double"
   ```

9. **PUT `/api/rooms/:id`** → Modifier une chambre
   - Je peux changer le prix, la disponibilité, etc.
   
   ```bash
   curl -X PUT http://localhost:3000/api/rooms/507f1f77bcf86cd799439012 \
     -H "Content-Type: application/json" \
     -d '{"prixNuit": 150, "disponible": false}'
   ```

10. **DELETE `/api/rooms/:id`** → Supprimer une chambre
    
    ```bash
    curl -X DELETE http://localhost:3000/api/rooms/507f1f77bcf86cd799439012
    ```

11. **GET `/api/rooms/stats/par-type`** → Statistiques par type
    - J'utilise une agrégation pour compter les chambres et calculer le prix moyen par type
    
    ```bash
    curl http://localhost:3000/api/rooms/stats/par-type
    ```

12. **GET `/api/rooms/plus-reservees`** → Chambres les plus réservées
    - C'est ma route avec `$lookup` (obligatoire)
    - J'utilise `$lookup` pour joindre les réservations avec les chambres
    - C'était un peu difficile au début mais j'ai réussi !
    
    ```bash
    curl http://localhost:3000/api/rooms/plus-reservees
    ```

### 📅 Routes pour les réservations (6 routes)

13. **POST `/api/reservations`** → Créer une réservation
    - C'est ma route d'écriture (obligatoire)
    - Je vérifie que l'email est valide
    - Je lie la réservation à un hôtel et une chambre
    
    ```bash
    curl -X POST http://localhost:3000/api/reservations \
      -H "Content-Type: application/json" \
      -d '{
        "hotelId": "6935659d629163fcc757ebea",
        "roomId": "507f1f77bcf86cd799439012",
        "client": {
          "nom": "Dupont",
          "email": "dupont@example.com",
          "telephone": "+33123456789"
        },
        "dateArrivee": "2024-01-15",
        "dateDepart": "2024-01-20",
        "prixTotal": 600,
        "statut": "en_attente"
      }'
    ```

14. **GET `/api/reservations`** → Voir toutes les réservations
    - Je peux filtrer par statut, dates
    
    ```bash
    curl "http://localhost:3000/api/reservations?statut=confirmee&page=1&limit=10"
    ```

15. **PUT `/api/reservations/:id`** → Modifier une réservation
    - Par exemple changer le statut
    
    ```bash
    curl -X PUT http://localhost:3000/api/reservations/507f1f77bcf86cd799439013 \
      -H "Content-Type: application/json" \
      -d '{"statut": "confirmee"}'
    ```

16. **DELETE `/api/reservations/:id`** → Supprimer une réservation
    
    ```bash
    curl -X DELETE http://localhost:3000/api/reservations/507f1f77bcf86cd799439013
    ```

17. **GET `/api/reservations/stats`** → Statistiques des réservations
    - J'utilise une agrégation pour grouper par statut et calculer les revenus
    
    ```bash
    curl http://localhost:3000/api/reservations/stats
    ```

18. **GET `/api/reservations/completes`** → Réservations avec détails complets
    - J'utilise plusieurs `$lookup` pour joindre l'hôtel ET la chambre
    - C'était compliqué mais j'ai réussi !
    
    ```bash
    curl http://localhost:3000/api/reservations/completes
    ```

---

## 🚀 Comment installer et lancer le projet

### 1. Installer les dépendances
```bash
npm install
```

### 2. Créer le fichier `.env`
Je crée un fichier `.env` à la racine avec :

```env
MONGODB_URI=mongodb://localhost:27017/hotel-booking
PORT=3000
```

### 3. Démarrer MongoDB
Si vous utilisez MongoDB local, je lance MongoDB dans un terminal :
```bash
mongod
```

**Note :** Si vous utilisez MongoDB Atlas (cloud), vous n'avez pas besoin de cette étape.

### 4. Démarrer mon serveur
Dans un autre terminal :
```bash
npm start
```

Si tout va bien, je vois :
```
✅ MongoDB connecté
🚀 Serveur sur http://localhost:3000
```

---

## 🐚 Comment utiliser curl dans Git Bash

Sur Windows, j'utilise Git Bash pour les commandes curl.

**Pour ouvrir Git Bash :**
- Clic droit dans le dossier → "Git Bash Here"
- OU dans VS Code : Terminal → Menu déroulant → "Git Bash"

**Pour coller :** Clic droit dans le terminal

**⚠️ Important :** Il faut toujours mettre `curl` devant l'URL !
- ✅ Correct : `curl http://localhost:3000/api/hotels`
- ❌ Incorrect : `http://localhost:3000/api/hotels` (ça ne marche pas, Git Bash essaie de l'exécuter comme une commande)

J'ai fait cette erreur au début, maintenant je me souviens toujours de mettre `curl` !

---

## 💾 Ma base de données

**Nom de la base :** `hotel-booking`

**J'ai 3 collections :**
- `hotels` → Pour stocker les hôtels
- `rooms` → Pour stocker les chambres
- `reservations` → Pour stocker les réservations

**⚠️ La base et les collections se créent toutes seules !** C'est MongoDB qui fait ça automatiquement quand on écrit dedans pour la première fois.

**J'utilise le driver MongoDB natif** (pas Mongoose) comme demandé dans le cours.

---

## 🛠️ Les technologies que j'utilise

- **Node.js** + **HTTP natif** → Pour créer mon API (pas Express, le cours demande HTTP natif)
- **MongoDB** → Ma base de données
- **MongoDB Driver natif** → Pour parler à MongoDB directement (pas Mongoose)
- **Validation manuelle** → J'utilise des regex pour vérifier les emails (pas de bibliothèque)

J'ai appris que c'est plus bas niveau que Express et Mongoose, mais ça m'aide à mieux comprendre comment ça marche vraiment.

---

## ❓ Questions que je me suis posées

**Comment je récupère l'ID d'un hôtel ?**
→ Quand je crée un hôtel, MongoDB me renvoie un `_id` dans la réponse. Je copie cet ID et je l'utilise pour modifier ou supprimer.

**Le serveur ne démarre pas ?**
→ Je vérifie que MongoDB est bien lancé avec `mongod` dans un terminal.

**Erreur "Cannot find module" ?**
→ Je fais `npm install` pour installer les dépendances.

**Pourquoi je n'utilise pas Express ou Mongoose ?**
→ Le cours demande d'utiliser HTTP natif et le driver MongoDB natif pour apprendre les bases. C'est plus long à écrire mais j'apprends mieux comme ça.

**Comment fonctionne la manipulation JSON ?**
→ Quand je crée un hôtel avec POST `/api/hotels`, j'écris aussi dans le fichier `data/hotels.json` en plus de MongoDB. C'est pour la partie manipulation de fichiers JSON du projet.

---

## 📊 Mes 3 routes obligatoires

Pour le projet, je devais faire 3 routes obligatoires :

1. **POST `/api/reservations`** → Ma route d'écriture
2. **GET `/api/hotels/recherche/avancee`** → Ma route de lecture avancée
3. **GET `/api/rooms/plus-reservees`** → Ma route d'agrégation avec lookup

J'ai aussi créé 15 autres routes que j'ai mises en commentaire dans le code pour mes camarades du groupe.

---

Voilà, c'est mon projet ! J'espère que c'est clair. Si vous avez des questions, n'hésitez pas ! 😊
