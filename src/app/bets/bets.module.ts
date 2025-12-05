import { Module } from '@nestjs/common';

import { BetsController } from './bets.controller';

import { BetsService } from './bets.service';
import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';

@Module({
  controllers: [BetsController],
  providers: [
    BetsService,
    PolkadotjsService
  ],
})
export class BetsModule { }
