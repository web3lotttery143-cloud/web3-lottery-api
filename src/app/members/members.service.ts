import { Inject, Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MEMBERS_MODEL } from 'src/database/constants/constants';
import { Member } from './entities/member.entity';
import { Model } from 'mongoose';
import { HttpStatus, NotFoundException, ConflictException } from '@nestjs/common';

@Injectable()
export class MembersService {
  constructor(
    @Inject(MEMBERS_MODEL)
    private membersModel: Model<Member>,
  ) {}

  async create(createMemberDto: CreateMemberDto) {
    const existing = await this.membersModel.findOne({
        member_address: createMemberDto.member_address,
    });

    if (existing) {
        throw new ConflictException('Member is already registered');
    }

    const createdMember = new this.membersModel(createMemberDto);
    const saved = await createdMember.save();

    return {
        message: 'Member registered successfully',
        data: saved,
    };
}

  async loginMember(dto: CreateMemberDto) {
      const member = await this.membersModel.findOne({
        member_address: dto.member_address,
      });

      if (member == null) {
        throw new NotFoundException('No existing record of wallet, please register first!');
      }

      return { message: 'Login successful', statusCode: HttpStatus.OK, data: member };
    
  }
}
