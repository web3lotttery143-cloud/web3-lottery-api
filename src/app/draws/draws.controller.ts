import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { DrawsService } from './draws.service';
import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';

@ApiTags('Draws')
@Controller('api/draws')
export class DrawsController {

  constructor(
    private readonly drawsService: DrawsService,
    private readonly polkadotJsService: PolkadotjsService
  ) { }

  @Get("get-draws")
  async getDraws() {
    try {
      const api = await this.polkadotJsService.connect();
      return this.drawsService.getDraws(api);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get draws',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
