import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import validator from 'validator';

dotenv.config();

// CONFIGURATION

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking';

app.use(cors());
app.use(express.json());


// CONNEXION MONGODB

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err.message);
    process.exit(1);
  });


// MODÈLES

import Hotel from './models/Hotel.js';
import Reservation from './models/Reservation.js';
import Room from './models/Room.js';

//personne 1 kanga kouassi franck 

// ROUTE 0: ACCUEIL

app.get('/', (req, res) => {
  res.json({
    message: 'API de réservation d\'hôtel projet backend node express et mongodb',
    version: '1.0.0',
    totalRoutes: 19
  });
});


// ROUTES HÔTELS 
 
// ROUTE 1: POST - Créer un hôtel
app.post('/api/hotels', async (req, res) => {
  try {
    if (!validator.isEmail(req.body.email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    const hotel = await Hotel.create(req.body);
    res.status(201).json({ message: 'Hôtel créé', hotel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 2: GET - Liste des hôtels avec filtres
app.get('/api/hotels', async (req, res) => {
  try {
    const { ville, etoiles, page = 1, limit = 10 } = req.query;
    const filter = { actif: true };
    
    if (ville) filter['adresse.ville'] = new RegExp(ville, 'i');
    if (etoiles) filter.etoiles = parseInt(etoiles);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const hotels = await Hotel.find(filter).limit(parseInt(limit)).skip(skip);
    const total = await Hotel.countDocuments(filter);

    res.json({ hotels, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 3: GET - Recherche avancée d'hôtels
app.get('/api/hotels/recherche/avancee', async (req, res) => {
  try {
    const { ville, etoilesMin, etoilesMax, actif } = req.query;
    const filter = {};
    
    // Par défaut, on cherche les hôtels actifs si actif n'est pas spécifié
    if (actif === undefined || actif === 'true') {
      filter.actif = true;
    } else if (actif === 'false') {
      filter.actif = false;
    }
    
    if (ville) filter['adresse.ville'] = new RegExp(ville, 'i');
    if (etoilesMin || etoilesMax) {
      filter.etoiles = {};
      if (etoilesMin) filter.etoiles.$gte = parseInt(etoilesMin);
      if (etoilesMax) filter.etoiles.$lte = parseInt(etoilesMax);
    }
    
    const hotels = await Hotel.find(filter);
    res.json({ count: hotels.length, hotels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//personne 2

// ROUTE 4: PUT - Modifier un hôtel
app.put('/api/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hotel) return res.status(404).json({ error: 'Hôtel non trouvé' });
    res.json({ message: 'Hôtel modifié', hotel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 5: DELETE - Supprimer un hôtel
app.delete('/api/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hôtel non trouvé' });
    res.json({ message: 'Hôtel supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 6: GET - Agrégation Top 5 hôtels par étoiles
app.get('/api/hotels/top/etoiles', async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: '$etoiles', nombre: { $sum: 1 }, hotels: { $push: '$nom' } } },
      { $sort: { _id: -1 } },
      { $limit: 5 },
      { $project: { etoiles: '$_id', nombre: 1, hotels: 1, _id: 0 } }
    ];
    const result = await Hotel.aggregate(pipeline);
    res.json({ topHotels: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



//personne 3

// ROUTES CHAMBRES 


// ROUTE 7: POST - Créer une chambre
app.post('/api/rooms', async (req, res) => {
  try {
    const { hotelId, numero, type, prixNuit, capacite } = req.body;
    if (!hotelId || !numero || !type || !prixNuit || !capacite) {
      return res.status(400).json({ error: 'Champs manquants' });
    }
    const room = await Room.create(req.body);
    res.status(201).json({ message: 'Chambre créée', room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 8: GET - Liste des chambres avec filtres
app.get('/api/rooms', async (req, res) => {
  try {
    const { hotelId, type, prixMin, prixMax, disponible, page = 1, limit = 10 } = req.query;
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
    const rooms = await Room.find(filter).populate('hotelId').limit(parseInt(limit)).skip(skip);
    const total = await Room.countDocuments(filter);
    
    res.json({ rooms, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 9: PUT - Modifier une chambre
app.put('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return res.status(404).json({ error: 'Chambre non trouvée' });
    res.json({ message: 'Chambre modifiée', room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//personne 4


// ROUTE 10: DELETE - Supprimer une chambre
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Chambre non trouvée' });
    res.json({ message: 'Chambre supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 11: GET - Agrégation Statistiques des chambres par type
app.get('/api/rooms/stats/par-type', async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: '$type', nombre: { $sum: 1 }, prixMoyen: { $avg: '$prixNuit' } } },
      { $sort: { nombre: -1 } },
      { $project: { type: '$_id', nombre: 1, prixMoyen: { $round: ['$prixMoyen', 2] }, _id: 0 } }
    ];
    const result = await Room.aggregate(pipeline);
    res.json({ statistiques: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 12: GET - Chambres les plus réservées (Lookup)
app.get('/api/rooms/plus-reservees', async (req, res) => {
  try {
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
    const result = await Room.aggregate(pipeline);
    res.json({ topChambres: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//personne 5

// ROUTES RÉSERVATIONS 

// ROUTE 13: POST - Créer une réservation
app.post('/api/reservations', async (req, res) => {
  try {
    const { hotelId, roomId, client, dateArrivee, dateDepart, prixTotal } = req.body;
    if (!hotelId || !roomId || !client || !dateArrivee || !dateDepart || !prixTotal) {
      return res.status(400).json({ error: 'Champs manquants' });
    }
    if (!validator.isEmail(client.email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    const reservation = await Reservation.create(req.body);
    res.status(201).json({ message: 'Réservation créée', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 14: GET - Liste des réservations avec filtres
app.get('/api/reservations', async (req, res) => {
  try {
    const { statut, dateDebut, dateFin, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (statut) filter.statut = statut;
    if (dateDebut || dateFin) {
      filter.dateArrivee = {};
      if (dateDebut) filter.dateArrivee.$gte = new Date(dateDebut);
      if (dateFin) filter.dateArrivee.$lte = new Date(dateFin);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reservations = await Reservation.find(filter).populate('hotelId').populate('roomId')
      .limit(parseInt(limit)).skip(skip);
    const total = await Reservation.countDocuments(filter);

    res.json({ reservations, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 15: PUT - Modifier une réservation
app.put('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    res.json({ message: 'Réservation modifiée', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//personne 6

// ROUTE 16: DELETE - Supprimer une réservation
app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    res.json({ message: 'Réservation supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 17: GET - Agrégation Statistiques des réservations

app.get('/api/reservations/stats', async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: '$statut', nombre: { $sum: 1 }, revenu: { $sum: '$prixTotal' } } },
      { $sort: { nombre: -1 } },
      { $project: { statut: '$_id', nombre: 1, revenu: { $round: ['$revenu', 2] }, _id: 0 } }
    ];
    const stats = await Reservation.aggregate(pipeline);
    const total = await Reservation.countDocuments();
    res.json({ stats, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 18: GET - Réservations avec détails complets (Lookup multiple)
app.get('/api/reservations/completes', async (req, res) => {
  try {
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
    
    const reservations = await Reservation.aggregate(pipeline);
    res.json({ reservations, nombre: reservations.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DÉMARRAGE

app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));