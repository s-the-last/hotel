import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  numero: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Simple', 'Double', 'Suite', 'Famille']
  },
  prixNuit: {
    type: Number,
    required: true,
    min: 0
  },
  disponible: {
    type: Boolean,
    default: true
  },
  capacite: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('Room', roomSchema);

