import { Module } from '@nestjs/common';

import { DrawsController } from './draws.controller';

import { DrawsService } from './draws.service';
import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';

@Module({
  controllers: [DrawsController],
  providers: [
    DrawsService,
    PolkadotjsService
  ],
})
export class DrawsModule { }
