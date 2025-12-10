import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
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
}
