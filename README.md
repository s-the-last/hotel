# 🏨 API de Réservation d'Hôtel

## 📐 Architecture du projet

```
No Sql/
├── index.js          → Tout le code principal (connexion, serveur, routes)
├── models/           → Les schémas Mongoose
│   ├── Hotel.js
│   ├── Room.js
│   └── Reservation.js
├── package.json      → Les dépendances
└── .env              → Configuration (MongoDB, PORT)
```

**Tout est centralisé dans `index.js`** pour rester simple et clair.

---

## 🔌 Explication de la connexion dans index.js

Dans mon fichier `index.js`, voici comment tout fonctionne :

### 1. Les imports (lignes 1-5)
```javascript
import express from 'express';      // Framework pour créer l'API
import mongoose from 'mongoose';    // Pour parler à MongoDB
import cors from 'cors';            // Autorise les requêtes depuis le navigateur
import dotenv from 'dotenv';        // Lit le fichier .env
import validator from 'validator';  // Valide les données (ex: email)
```

### 2. Configuration Express (lignes 11-16)
```javascript
const app = express();              // Crée l'application Express
const PORT = process.env.PORT || 3000;  // Port depuis .env ou 3000 par défaut
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking';

app.use(cors());                    // Active CORS
app.use(express.json());            // Permet de lire les données JSON
```

### 3. Connexion MongoDB (lignes 21-26)
```javascript
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))  // Si ça marche
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err.message);  // Si erreur
    process.exit(1);  // Arrête le serveur
  });
```
Se connecte à MongoDB. Si la base n'existe pas, elle sera créée automatiquement.

### 4. Import des modèles (lignes 31-33)
```javascript
import Hotel from './models/Hotel.js';
import Reservation from './models/Reservation.js';
import Room from './models/Room.js';
```
Charge les schémas Mongoose pour pouvoir créer/modifier/supprimer des données.

---

## 🛣️ Explication des routes et leur rôle

### 🏠 Route 0: Accueil

**GET `/`** → Page d'accueil de l'API
- **Rôle :** Affiche les informations générales de l'API
- **Retourne :** Message de bienvenue, version, nombre total de routes

```bash
curl http://localhost:3000/
```

---

### 🏨 Routes Hôtels (6 routes)

1. **POST `/api/hotels`** → Créer un nouvel hôtel
   - **Rôle :** Ajoute un hôtel dans la base de données
   - **Validation :** Vérifie que l'email est valide
   
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
   - **Rôle :** Liste les hôtels avec filtres (ville, étoiles) et pagination
   - **Filtres :** `?ville=Paris&etoiles=4&page=1&limit=10`
   
   ```bash
   # Sans filtres
   curl http://localhost:3000/api/hotels
   
   # Avec filtres
   curl "http://localhost:3000/api/hotels?ville=Paris&etoiles=4&page=1&limit=10"
   ```

3. **GET `/api/hotels/recherche/avancee`** → Recherche avancée
   - **Rôle :** Recherche avec plusieurs critères (ville, étoiles min/max)
   - **C'est ma route de lecture avancée** (obligatoire pour le projet)
   
   ```bash
   curl "http://localhost:3000/api/hotels/recherche/avancee?ville=Paris&etoilesMin=3&etoilesMax=5"
   ```

4. **PUT `/api/hotels/:id`** → Modifier un hôtel
   - **Rôle :** Met à jour les informations d'un hôtel existant
   
   ```bash
   curl -X PUT http://localhost:3000/api/hotels/507f1f77bcf86cd799439011 \
     -H "Content-Type: application/json" \
     -d '{"etoiles": 5, "description": "Hôtel de luxe"}'
   ```

5. **DELETE `/api/hotels/:id`** → Supprimer un hôtel
   - **Rôle :** Supprime un hôtel de la base
   
   ```bash
   curl -X DELETE http://localhost:3000/api/hotels/507f1f77bcf86cd799439011
   ```

6. **GET `/api/hotels/top/etoiles`** → Top 5 hôtels par étoiles
   - **Rôle :** Agrégation MongoDB qui groupe les hôtels par nombre d'étoiles
   - **C'est ma route d'agrégation** (obligatoire pour le projet)
   
   ```bash
   curl http://localhost:3000/api/hotels/top/etoiles
   ```

### 🛏️ Routes Chambres (6 routes)

7. **POST `/api/rooms`** → Créer une chambre
   - **Rôle :** Ajoute une chambre liée à un hôtel
   
   ```bash
   curl -X POST http://localhost:3000/api/rooms \
     -H "Content-Type: application/json" \
     -d '{
       "hotelId": "507f1f77bcf86cd799439011",
       "numero": "101",
       "type": "Double",
       "prixNuit": 120,
       "capacite": 2
     }'
   ```

8. **GET `/api/rooms`** → Voir toutes les chambres
   - **Rôle :** Liste les chambres avec filtres (hôtel, type, prix, disponibilité)
   
   ```bash
   curl "http://localhost:3000/api/rooms?hotelId=507f1f77bcf86cd799439011&type=Double"
   ```

9. **PUT `/api/rooms/:id`** → Modifier une chambre
   - **Rôle :** Met à jour une chambre (prix, disponibilité, etc.)
   
   ```bash
   curl -X PUT http://localhost:3000/api/rooms/507f1f77bcf86cd799439012 \
     -H "Content-Type: application/json" \
     -d '{"prixNuit": 150, "disponible": false}'
   ```

10. **DELETE `/api/rooms/:id`** → Supprimer une chambre
    - **Rôle :** Supprime une chambre
    
    ```bash
    curl -X DELETE http://localhost:3000/api/rooms/507f1f77bcf86cd799439012
    ```

11. **GET `/api/rooms/stats/par-type`** → Statistiques par type
    - **Rôle :** Agrégation qui compte les chambres et calcule le prix moyen par type
    
    ```bash
    curl http://localhost:3000/api/rooms/stats/par-type
    ```

12. **GET `/api/rooms/plus-reservees`** → Chambres les plus réservées
    - **Rôle :** Agrégation avec `$lookup` pour joindre les réservations
    - **C'est ma route avec lookup** (obligatoire pour le projet)
    
    ```bash
    curl http://localhost:3000/api/rooms/plus-reservees
    ```

### 📅 Routes Réservations (6 routes)

13. **POST `/api/reservations`** → Créer une réservation
    - **Rôle :** Crée une réservation liée à un hôtel et une chambre
    - **Validation :** Vérifie que l'email du client est valide
    - **C'est ma route d'écriture** (obligatoire pour le projet)
    
    ```bash
    curl -X POST http://localhost:3000/api/reservations \
      -H "Content-Type: application/json" \
      -d '{
        "hotelId": "507f1f77bcf86cd799439011",
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
    - **Rôle :** Liste les réservations avec filtres (statut, dates)
    
    ```bash
    curl "http://localhost:3000/api/reservations?statut=confirmee&page=1&limit=10"
    ```

15. **PUT `/api/reservations/:id`** → Modifier une réservation
    - **Rôle :** Met à jour une réservation (ex: changer le statut)
    
    ```bash
    curl -X PUT http://localhost:3000/api/reservations/507f1f77bcf86cd799439013 \
      -H "Content-Type: application/json" \
      -d '{"statut": "confirmee"}'
    ```

16. **DELETE `/api/reservations/:id`** → Supprimer une réservation
    - **Rôle :** Supprime une réservation
    
    ```bash
    curl -X DELETE http://localhost:3000/api/reservations/507f1f77bcf86cd799439013
    ```

17. **GET `/api/reservations/stats`** → Statistiques des réservations
    - **Rôle :** Agrégation qui groupe par statut et calcule les revenus
    
    ```bash
    curl http://localhost:3000/api/reservations/stats
    ```

18. **GET `/api/reservations/completes`** → Réservations avec détails complets
    - **Rôle :** Agrégation avec `$lookup` multiple pour joindre hôtel ET chambre
    
    ```bash
    curl http://localhost:3000/api/reservations/completes
    ```

---

## 🚀 Installation rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Créer le fichier `.env`
Créez un fichier `.env` à la racine du projet :

```env
MONGODB_URI=mongodb://localhost:27017/hotel-booking
PORT=3000
```

### 3. Démarrer MongoDB
```bash
mongod
```

### 4. Démarrer le serveur
```bash
npm start
```

Vous devriez voir :
```
✅ MongoDB connecté
🚀 Serveur sur http://localhost:3000
```

---

## 🐚 Utiliser Git Bash avec curl

**Sur Windows, utilisez Git Bash pour les commandes curl.**

**Ouvrir Git Bash :**
- Clic droit dans le dossier → **"Git Bash Here"**
- OU dans VS Code : Terminal → Menu déroulant → **"Git Bash"**

**Coller dans Git Bash :** Clic droit dans le terminal

---

## 💾 Base de données

**Nom :** `hotel-booking`

**3 collections :**
- `hotels` → Les hôtels
- `rooms` → Les chambres
- `reservations` → Les réservations

**⚠️ La base et les collections se créent automatiquement !**

---

## 🛠️ Technologies

- **Node.js** + **Express** → API
- **MongoDB** → Base de données
- **Mongoose** → Modélisation des données
- **Validator** → Validation des données

---

## ❓ Questions fréquentes

**Comment obtenir l'ID d'un hôtel ?**
→ L'ID est dans la réponse quand vous créez un hôtel (champ `_id`)

**Le serveur ne démarre pas ?**
→ Vérifiez que MongoDB est démarré (`mongod`)

**Erreur "Cannot find module" ?**
→ Faites `npm install`

---

## 📊 Mes 3 routes obligatoires (résumé)

1. **POST `/api/reservations`** → Route d'écriture
2. **GET `/api/hotels/recherche/avancee`** → Route de lecture avancée
3. **GET `/api/rooms/plus-reservees`** → Route d'agrégation avec lookup

Les 15 autres routes sont dans le code en commentaires pour mes camarades.

---

**Bon développement ! 🚀**
