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
    private membersModel: Model<Member>
  ) {}

  create(createMemberDto: CreateMemberDto): Promise<Member> {
    const createdMember = new this.membersModel(createMemberDto)
    return createdMember.save()
  }

}
