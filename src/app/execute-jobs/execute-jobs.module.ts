import { Module } from '@nestjs/common';

import { ExecuteJobsService } from './execute-jobs.service';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';

@Module({
  providers: [
    ExecuteJobsService,
    PolkadotjsService,
  ],
})
export class ExecuteJobsModule { }
