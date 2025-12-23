import * as mongoose from 'mongoose';


export const BetSchema = new mongoose.Schema({
  bet_number: String,
  bet_amount: String,
  transaction_hash: String,
  draw_number: String,
  date: { type: Date, default: Date.now },
})
export const MemberBetsSchema = new mongoose.Schema({
  member_address: { type: String, required: true, unique: true },
  bets: { type: [BetSchema], default: [] },
});
