import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  cif: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  balance: { type: Number, required: true },
  trustScore: { type: Number, required: true },
  currentDevice: { type: String, required: true },
  currentIP: { type: String, required: true },
  currentLocation: { type: String, required: true },
  loginHistory: [{
    timestamp: String,
    ip: String,
    location: String,
    device: String,
    isNewDevice: Boolean
  }],
  avgTransactionAmount: { type: Number, required: true },
  dailyAverageAmount: { type: Number, required: true },
  accessFrequency: { type: Number, required: true }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
