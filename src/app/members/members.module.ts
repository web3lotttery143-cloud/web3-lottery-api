import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { DatabaseModule } from 'src/database/database.module';
import { membersProviders } from './members.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [MembersController],
  providers: [MembersService, ...membersProviders],
})
export class MembersModule {}
