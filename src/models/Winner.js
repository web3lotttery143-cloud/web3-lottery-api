import mongoose from 'mongoose';

const winnerSchema = new mongoose.Schema({
  cycleNumber: {
    type: Number,
    required: true,
    index: true,
  },
  winnerWalletAddress: {
    type: String,
    required: true,
    index: true,
  },
  uplineWalletAddress: {
    type: String,
    index: true,
  },
  jackpotShare: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  uplineShare: {
    type: mongoose.Schema.Types.Decimal128,
  },
  payoutTxHash: {
    type: String,
    required: true,
  },
});

const Winner = mongoose.model('Winner', winnerSchema);
export default Winner;
