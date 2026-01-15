import { Body, Controller, Post, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { DrawsService } from './draws.service';
import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';

import { OverrideDrawDto } from './dto/override-draw.dto';
import { ExecuteDrawDto } from './dto/execute-draw.dto';
import { AddDrawJackpotDto } from '../bets/dto/add-draw-jackpot.dto';
import { ExecuteDrawJackpotDto } from '../bets/dto/execute-draw-jackpot.dto';

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

  @Post('override')
  async overrideDraw(
    @Body() overrideDrawDto: OverrideDrawDto
  ) {
    try {
      const api = await this.polkadotJsService.connect();
      return this.drawsService.overrideDraw(api, overrideDrawDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to override draw',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('execute')
  async executeDraw(@Body() executeDrawDto: ExecuteDrawDto) {
    try {
      const api = await this.polkadotJsService.connect();
      return await this.drawsService.executeDraw(api, executeDrawDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to execute draw',
          error: error instanceof Error ? error.message : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('add-draw-jackpot')
  async addDrawJackpot(@Body() addDrawJackpotDto: AddDrawJackpotDto) {
    try {
      const api = await this.polkadotJsService.connect();
      return this.drawsService.addDrawJackpot(api, addDrawJackpotDto);
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

  @Post('execute-draw-jackpot')
  async executeDrawJackpot(@Body() executeDrawJackpotDto: ExecuteDrawJackpotDto) {
    try {
      const api = await this.polkadotJsService.connect();
      return await this.drawsService.executeDrawJackpot(api, executeDrawJackpotDto);
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
}