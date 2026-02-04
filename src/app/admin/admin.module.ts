import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DatabaseModule } from 'src/database/database.module';
import { membersProviders } from '../members/members.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [AdminService, ...membersProviders],
})
export class AdminModule {}
