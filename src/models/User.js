import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  profileImageUrl: {
    type: String,
    required: true,
  },
  referrerWalletAddress: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  },
  totalAffiliateEarnings: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.0,
  },
  totalRebates: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.0,
  },
  pushNotificationTokens: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
export default User;
