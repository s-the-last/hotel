import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  adresse: {
    rue: { type: String, required: true },
    ville: { type: String, required: true },
    codePostal: { type: String, required: true },
    pays: { type: String, default: 'France' }
  },
  telephone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  etoiles: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  description: {
    type: String
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Hotel', hotelSchema);

