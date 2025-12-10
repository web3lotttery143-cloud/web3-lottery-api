import * as mongoose from 'mongoose';

export const MembersSchema = new mongoose.Schema({
  member_address: String,
  upline_address: String
});
