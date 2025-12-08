import http from 'http';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

// CONFIGURATION
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking';

// Chemins pour les fichiers JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JSON_FILE = join(__dirname, 'data', 'hotels.json');

// CONNEXION MONGODB
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

// FONCTION UTILITAIRE : Parser le body de la requête
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// FONCTION UTILITAIRE : Validation email simple
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// FONCTION UTILITAIRE : Parser les query params
function parseQuery(url) {
  const query = {};
  const urlObj = new URL(url, `http://localhost:${PORT}`);
  urlObj.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

// FONCTION UTILITAIRE : Extraire l'ID de l'URL
function extractId(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// FONCTION UTILITAIRE : Réponse JSON
function sendJSON(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

// HELPERS pour raccourcir les routes
async function updateById(collection, id, data, res, name) {
  try {
    const objectId = new ObjectId(id);
    const result = await collection.updateOne({ _id: objectId }, { $set: data });
    if (result.matchedCount === 0) {
      sendJSON(res, 404, { error: `${name} non trouvé${name.endsWith('e') ? 'e' : ''}` });
      return;
    }
    const item = await collection.findOne({ _id: objectId });
    sendJSON(res, 200, { message: `${name} modifié${name.endsWith('e') ? 'e' : ''}`, [name.toLowerCase()]: item });
  } catch (err) {
    sendJSON(res, 400, { error: 'ID invalide' });
  }
}

async function deleteById(collection, id, res, name) {
  try {
    const objectId = new ObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) {
      sendJSON(res, 404, { error: `${name} non trouvé${name.endsWith('e') ? 'e' : ''}` });
      return;
    }
    sendJSON(res, 200, { message: `${name} supprimé${name.endsWith('e') ? 'e' : ''}` });
  } catch (err) {
    sendJSON(res, 400, { error: 'ID invalide' });
  }
}

// SERVEUR HTTP
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  const method = req.method;

  try {
    // ROUTE 0: ACCUEIL
    if (url === '/' && method === 'GET') {
      sendJSON(res, 200, {
        message: 'API de réservation d\'hôtel projet backend node express et mongodb',
        version: '1.0.0',
        totalRoutes: 19
      });
      return;
    }
//persone1
    // ROUTE 1: POST - Créer un hôtel
    if (url === '/api/hotels' && method === 'POST') {
      const data = await parseBody(req);
      if (!isValidEmail(data.email)) {
        sendJSON(res, 400, { error: 'Email invalide' });
        return;
      }
      if (data.actif === undefined) data.actif = true;
      const result = await hotels.insertOne(data);
      try {
        const jsonData = JSON.parse(readFileSync(JSON_FILE, 'utf8') || '[]');
        jsonData.push({ ...data, _id: result.insertedId.toString() });
        writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2));
      } catch (err) {
        writeFileSync(JSON_FILE, JSON.stringify([{ ...data, _id: result.insertedId.toString() }], null, 2));
      }
      sendJSON(res, 201, { message: 'Hôtel créé', hotel: { ...data, _id: result.insertedId } });
      return;
    }

    // ROUTE 2: GET - Liste des hôtels
    if (url.startsWith('/api/hotels') && method === 'GET' && !url.includes('/recherche') && !url.includes('/top')) {
      const query = parseQuery(url);
      const { ville, etoiles, page = 1, limit = 10 } = query;
      const filter = { actif: true };
      if (ville) filter['adresse.ville'] = new RegExp(ville, 'i');
      if (etoiles) filter.etoiles = parseInt(etoiles);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const hotelsList = await hotels.find(filter).limit(parseInt(limit)).skip(skip).toArray();
      const total = await hotels.countDocuments(filter);
      sendJSON(res, 200, { hotels: hotelsList, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
      return;
    }

    // ROUTE 3: GET - Recherche avancée
    if (url.startsWith('/api/hotels/recherche/avancee') && method === 'GET') {
      const query = parseQuery(url);
      const { ville, etoilesMin, etoilesMax, actif } = query;
      const filter = {};
      if (actif === undefined || actif === 'true') filter.actif = true;
      else if (actif === 'false') filter.actif = false;
      if (ville) filter['adresse.ville'] = new RegExp(ville, 'i');
      if (etoilesMin || etoilesMax) {
        filter.etoiles = {};
        if (etoilesMin) filter.etoiles.$gte = parseInt(etoilesMin);
        if (etoilesMax) filter.etoiles.$lte = parseInt(etoilesMax);
      }
      const hotelsList = await hotels.find(filter).toArray();
      sendJSON(res, 200, { count: hotelsList.length, hotels: hotelsList });
      return;
    }
//persone2
    // ROUTE 4: PUT - Modifier un hôtel
    if (url.startsWith('/api/hotels/') && method === 'PUT' && !url.includes('/top') && !url.includes('/recherche')) {
      const data = await parseBody(req);
      await updateById(hotels, extractId(url), data, res, 'Hôtel');
      return;
    }

    // ROUTE 5: DELETE - Supprimer un hôtel
    if (url.startsWith('/api/hotels/') && method === 'DELETE') {
      await deleteById(hotels, extractId(url), res, 'Hôtel');
      return;
    }

    // ROUTE 6: GET - Agrégation Top 5 hôtels par étoiles
    if (url === '/api/hotels/top/etoiles' && method === 'GET') {
      const pipeline = [
        { $group: { _id: '$etoiles', nombre: { $sum: 1 }, hotels: { $push: '$nom' } } },
        { $sort: { _id: -1 } },
        { $limit: 5 },
        { $project: { etoiles: '$_id', nombre: 1, hotels: 1, _id: 0 } }
      ];
      const result = await hotels.aggregate(pipeline).toArray();
      sendJSON(res, 200, { topHotels: result });
      return;
    }
//persone3
    // ROUTE 7: POST - Créer une chambre
    if (url === '/api/rooms' && method === 'POST') {
      const data = await parseBody(req);
      if (!data.hotelId || !data.numero || !data.type || !data.prixNuit || !data.capacite) {
        sendJSON(res, 400, { error: 'Champs manquants' });
        return;
      }
      if (data.disponible === undefined) data.disponible = true;
      const result = await rooms.insertOne(data);
      sendJSON(res, 201, { message: 'Chambre créée', room: { ...data, _id: result.insertedId } });
      return;
    }

    // ROUTE 8: GET - Liste des chambres
    if (url.startsWith('/api/rooms') && method === 'GET' && !url.includes('/stats') && !url.includes('/plus-reservees')) {
      const query = parseQuery(url);
      const { hotelId, type, prixMin, prixMax, disponible, page = 1, limit = 10 } = query;
      const filter = {};
      if (hotelId) filter.hotelId = hotelId;
      if (type) filter.type = type;
      if (disponible !== undefined) filter.disponible = disponible === 'true';
      if (prixMin || prixMax) {
        filter.prixNuit = {};
        if (prixMin) filter.prixNuit.$gte = parseInt(prixMin);
        if (prixMax) filter.prixNuit.$lte = parseInt(prixMax);
      }
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const roomsList = await rooms.find(filter).limit(parseInt(limit)).skip(skip).toArray();
      const total = await rooms.countDocuments(filter);
      sendJSON(res, 200, { rooms: roomsList, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
      return;
    }

    // ROUTE 9: PUT - Modifier une chambre
    if (url.startsWith('/api/rooms/') && method === 'PUT' && !url.includes('/stats') && !url.includes('/plus-reservees')) {
      const data = await parseBody(req);
      await updateById(rooms, extractId(url), data, res, 'Chambre');
      return;
    }
//persone4

// ROUTE 10 : POST - Créer un nouveau type de chambre
if (url === '/api/rooms/types' && method === 'POST') {
  const data = await parseBody(req);
  
  if (!data.type || !data.description) {
    sendJSON(res, 400, { error: 'Type et description requis' });
    return;
  }
  sendJSON(res, 201, { 
    message: 'Nouveau type ajouté au catalogue',
    type: data.type,
    description: data.description,
    prixEstime: data.prixRecommande || 350,  // 350€ par défaut
    statut: 'en_etude',
    dateCreation: new Date().toISOString()
    });
    return;
   }

    // ROUTE 11: GET - Agrégation Statistiques des chambres par type
    if (url === '/api/rooms/stats/par-type' && method === 'GET') {
      const pipeline = [
        { $group: { _id: '$type', nombre: { $sum: 1 }, prixMoyen: { $avg: '$prixNuit' } } },
        { $sort: { nombre: -1 } },
        { $project: { type: '$_id', nombre: 1, prixMoyen: { $round: ['$prixMoyen', 2] }, _id: 0 } }
      ];
      const result = await rooms.aggregate(pipeline).toArray();
      sendJSON(res, 200, { statistiques: result });
      return;
    }

    // ROUTE 12: GET - Chambres les plus réservées (Lookup)
    if (url === '/api/rooms/plus-reservees' && method === 'GET') {
      const pipeline = [
        {
          $lookup: {
            from: 'reservations',
            localField: '_id',
            foreignField: 'roomId',
            as: 'reservations'
          }
        },
        { $project: { numero: 1, type: 1, prixNuit: 1, nombreReservations: { $size: '$reservations' } } },
        { $sort: { nombreReservations: -1 } },
        { $limit: 10 }
      ];
      const result = await rooms.aggregate(pipeline).toArray();
      sendJSON(res, 200, { topChambres: result });
      return;
    }

    // ROUTE bonus: DELETE - Supprimer une chambre
    if (url.startsWith('/api/rooms/') && method === 'DELETE' && !url.includes('/stats') && !url.includes('/plus-reservees')) {
      await deleteById(rooms, extractId(url), res, 'Chambre');
      return;
    }

//persone5
    // ROUTE 13: POST - Créer une réservation
    if (url === '/api/reservations' && method === 'POST') {
      const data = await parseBody(req);
      if (!data.hotelId || !data.roomId || !data.client || !data.dateArrivee || !data.dateDepart || !data.prixTotal) {
        sendJSON(res, 400, { error: 'Champs manquants' });
        return;
      }
      if (!isValidEmail(data.client.email)) {
        sendJSON(res, 400, { error: 'Email invalide' });
        return;
      }
      if (data.statut === undefined) data.statut = 'en_attente';
      const result = await reservations.insertOne(data);
      sendJSON(res, 201, { message: 'Réservation créée', reservation: { ...data, _id: result.insertedId } });
      return;
    }

    // ROUTE 14: GET - Liste des réservations
    if (url.startsWith('/api/reservations') && method === 'GET' && !url.includes('/stats') && !url.includes('/completes')) {
      const query = parseQuery(url);
      const { statut, dateDebut, dateFin, page = 1, limit = 10 } = query;
      const filter = {};
      if (statut) filter.statut = statut;
      if (dateDebut || dateFin) {
        filter.dateArrivee = {};
        if (dateDebut) filter.dateArrivee.$gte = new Date(dateDebut);
        if (dateFin) filter.dateArrivee.$lte = new Date(dateFin);
      }
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const reservationsList = await reservations.find(filter).limit(parseInt(limit)).skip(skip).toArray();
      const total = await reservations.countDocuments(filter);
      sendJSON(res, 200, { reservations: reservationsList, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
      return;
    }
//persone6
    // ROUTE 15: PUT - Modifier une réservation
    if (url.startsWith('/api/reservations/') && method === 'PUT' && !url.includes('/stats') && !url.includes('/completes')) {
      const data = await parseBody(req);
      await updateById(reservations, extractId(url), data, res, 'Réservation');
      return;
    }

    // ROUTE 16: DELETE - Supprimer une réservation
    if (url.startsWith('/api/reservations/') && method === 'DELETE' && !url.includes('/stats') && !url.includes('/completes')) {
      await deleteById(reservations, extractId(url), res, 'Réservation');
      return;
    }

    // ROUTE 17: GET - Agrégation Statistiques des réservations
    if (url === '/api/reservations/stats' && method === 'GET') {
      const pipeline = [
        { $group: { _id: '$statut', nombre: { $sum: 1 }, revenu: { $sum: '$prixTotal' } } },
        { $sort: { nombre: -1 } },
        { $project: { statut: '$_id', nombre: 1, revenu: { $round: ['$revenu', 2] }, _id: 0 } }
      ];
      const stats = await reservations.aggregate(pipeline).toArray();
      const total = await reservations.countDocuments();
      sendJSON(res, 200, { stats, total });
      return;
    }

    // ROUTE 18: GET - Réservations avec détails complets 
    if (url === '/api/reservations/completes' && method === 'GET') {
      const pipeline = [
        {
          $lookup: {
            from: 'hotels',
            localField: 'hotelId',
            foreignField: '_id',
            as: 'hotel'
          }
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room'
          }
        },
        { $unwind: '$hotel' },
        { $unwind: '$room' },
        {
          $project: {
            'hotel.nom': 1,
            'hotel.etoiles': 1,
            'room.numero': 1,
            'room.type': 1,
            'client.nom': 1,
            'client.email': 1,
            dateArrivee: 1,
            dateDepart: 1,
            prixTotal: 1,
            statut: 1
          }
        },
        { $sort: { dateArrivee: -1 } }
      ];
      
      const reservationsList = await reservations.aggregate(pipeline).toArray();
      sendJSON(res, 200, { reservations: reservationsList, nombre: reservationsList.length });
      return;
    }

    // Route non trouvée
    sendJSON(res, 404, { error: 'Route non trouvée' });

  } catch (error) {
    console.error('Erreur:', error);
    sendJSON(res, 500, { error: error.message });
  }
});

// DÉMARRAGE
server.listen(PORT, () => {
  console.log(`🚀 Serveur sur http://localhost:${PORT}`);
});
