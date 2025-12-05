import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LotteryService } from './lottery.service';
import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';

@ApiTags('Lottery')
@Controller('api/lottery')
export class LotteryController {

  constructor(
    private readonly lotteryService: LotteryService,
    private readonly polkadotJsService: PolkadotjsService
  ) { }

  @Get("get-lottery-setup")
  async getLotterySetup() {
    try {
      const api = await this.polkadotJsService.connect();
      return this.lotteryService.getLotterySetup(api);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get lottery setup',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
