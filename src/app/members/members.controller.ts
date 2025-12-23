import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateMemberBetDto } from './dto/create-member-bet.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() createMemberDto: CreateMemberDto) {
    try {
      return this.membersService.create(createMemberDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to register',
          error:
            error instanceof Error
              ? error.message
              : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async loginMember(@Body() dto: CreateMemberDto) {
    try {
      const result = await this.membersService.loginMember(dto);
      return { statusCode: result.statusCode, message: result.message, data: result.data };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Something went wrong',
          error:
            error instanceof Error
              ? error.message
              : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('bets/:member_address')
  getMemberBets(@Param('member_address') memberAddress: string) {
    return this.membersService.getMemberBets(memberAddress);
  }


  @Post('bets/')
  async createMemberBet(@Body() dto: CreateMemberBetDto) {
    try {
      return this.membersService.createMemberBet(dto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to create bet',
          error:
            error instanceof Error
              ? error.message
              : new Error(String(error)).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    
  }
}
