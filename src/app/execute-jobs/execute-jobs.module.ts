import { Module } from '@nestjs/common';

import { ExecuteJobsService } from './execute-jobs.service';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';
import { ExecuteJobsGateway } from './execute-jobs.gateway';

@Module({
  providers: [
    ExecuteJobsService,
    PolkadotjsService,
    ExecuteJobsGateway,
  ],
})
export class ExecuteJobsModule { }
