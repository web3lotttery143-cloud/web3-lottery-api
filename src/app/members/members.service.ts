import { Inject, Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MEMBERS_MODEL } from 'src/database/constants/constants';
import { Member } from './entities/member.entity';
import { Model } from 'mongoose';

@Injectable()
export class MembersService {
  constructor(
    @Inject(MEMBERS_MODEL)
    private membersModel: Model<Member>,
  ) {}

  async create(
    createMemberDto: CreateMemberDto,
  ): Promise<{ message: string; data: Member }> {
    try {
      const existing = await this.membersModel.findOne({
        member_address: createMemberDto.member_address,
      });

      if (existing) {
        return { message: 'Member is already registered', data: existing };
      }

      const createdMember = new this.membersModel(createMemberDto);
      const saved = await createdMember.save();

      return { message: 'Member created successfully', data: saved };
    } catch (error) {
      return error;
    }
  }
}
