import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  client: {
    nom: { type: String, required: true },
    email: { type: String, required: true },
    telephone: { type: String, required: true }
  },
  dateArrivee: {
    type: Date,
    required: true
  },
  dateDepart: {
    type: Date,
    required: true
  },
  prixTotal: {
    type: Number,
    required: true,
    min: 0
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'annulee'],
    default: 'en_attente'
  }
}, {
  timestamps: true
});

export default mongoose.model('Reservation', reservationSchema);

