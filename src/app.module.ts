import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { LotteryModule } from './app/lottery/lottery.module';
import { DrawsModule } from './app/draws/draws.module';
import { BetsModule } from './app/bets/bets.module';
import { PolkadotjsModule } from './app/polkadotjs/polkadotjs.module';
import { ExecuteJobsModule } from './app/execute-jobs/execute-jobs.module';
import { MembersModule } from './app/members/members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    LotteryModule,
    DrawsModule,
    BetsModule,
    ExecuteJobsModule,
    PolkadotjsModule,
    MembersModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
  ],
})
export class AppModule { }
