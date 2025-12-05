import { Module } from '@nestjs/common';
import { PolkadotjsService } from './polkadotjs.service';

@Module({
  providers: [PolkadotjsService],
})
export class PolkadotjsModule { }
