import mongoose from 'mongoose';

const betSchema = new mongoose.Schema({
  cycleNumber: {
    type: Number,
    required: true,
    index: true,
  },
  bettorWalletAddress: {
    type: String,
    required: true,
    index: true,
  },
  selectedNumber: {
    type: String,
    required: true,
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true,
  },
  betAmount: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.5,
  },
  rebateCredited: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.05,
  },
  affiliateShareCredited: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.05,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Bet = mongoose.model('Bet', betSchema);
export default Bet;
