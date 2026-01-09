import { Module } from '@nestjs/common';

import { ExecuteJobsService } from './execute-jobs.service';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';
import { ExecuteJobsGateway } from './execute-jobs.gateway';
import { ExecuteJobsController } from './execute-jobs.controller';

@Module({
  providers: [
    ExecuteJobsService,
    PolkadotjsService,
    ExecuteJobsGateway,
  ],
  controllers: [ExecuteJobsController],
})
export class ExecuteJobsModule { }
