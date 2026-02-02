import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { MEMBER_BETS_MODEL } from '../constants/constants';

async function migrate() {
  console.log('🚀 Starting migration to add success field to bets...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the MemberBets model using your custom provider token
    const memberBetsModel = app.get<Model<any>>(MEMBER_BETS_MODEL);
    
    // Update all bets that don't have the success field
    const result = await memberBetsModel.updateMany(
      { 'bets.success': { $exists: false } },
      { $set: { 'bets.$[].success': true } }
    );
    
    console.log(`✅ Migration complete!`);
    console.log(`📊 Documents matched: ${result.matchedCount}`);
    console.log(`📝 Documents modified: ${result.modifiedCount}`);
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();