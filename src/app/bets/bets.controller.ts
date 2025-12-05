import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BetsService } from './bets.service';
import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';

import { ExecuteBetDto } from './dto/execute-bet.dto';

@ApiTags('Bets')
@Controller('api/bets')
export class BetsController {

  constructor(
    private readonly betsService: BetsService,
    private readonly polkadotJsService: PolkadotjsService
  ) { }

  @Post('add')
  async addBet() {
    try {
      const api = await this.polkadotJsService.connect();
      return this.betsService.addBet(api);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to add bet',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('execute')
  async executeBet(@Body() executeBetDto: ExecuteBetDto) {
    try {
      const api = await this.polkadotJsService.connect();
      return await this.betsService.executeBet(api, executeBetDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to execute bet',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("get-bets/:draw_number")
  async getBets(@Param('draw_number') draw_number: number) {
    try {
      const api = await this.polkadotJsService.connect();
      return this.betsService.getBets(api, draw_number);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get bets',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
