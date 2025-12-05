import { Module } from '@nestjs/common';

import { LotteryController } from './lottery.controller';

import { LotteryService } from './lottery.service';
import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';

@Module({
  controllers: [LotteryController],
  providers: [
    LotteryService,
    PolkadotjsService
  ],
})
export class LotteryModule { }
