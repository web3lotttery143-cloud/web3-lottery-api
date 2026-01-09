import { Controller, Post } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

import { ExecuteJobsService } from './execute-jobs.service';

@Controller('execute-jobs')
export class ExecuteJobsController {

  constructor(
    private readonly executeJobsService: ExecuteJobsService
  ) { }

  @Post('start')
  start() {
    try {
      return this.executeJobsService.startLotteryJob();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to start job',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stop')
  stop() {
    try {
      return this.executeJobsService.stopLotteryJob();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to stop job',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}