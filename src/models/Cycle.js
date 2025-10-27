import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema({
  cycleNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['OPEN', 'CLOSED', 'COMPLETED'],
    default: 'OPEN',
    index: true,
  },
  totalJackpot: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0.0,
  },
  operatorBalance: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0.0,
  },
  transactionFeeBalance: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0.0,
  },

  totalBets: {
    type: Number,
    default: 0,
  },
  winningNumber: {
    type: String,
  },
  drawMethod: {
    type: String,
    enum: ['VRF', 'MANUAL'],
  },
  totalWinners: {
    type: Number,
    default: 0,
  },
  jackpotRolledOver: {
    type: Boolean,
    default: false,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
});

const Cycle = mongoose.model('Cycle', cycleSchema);
export default Cycle;
