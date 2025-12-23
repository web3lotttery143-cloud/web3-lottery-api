import { Inject, Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateMemberBetDto } from './dto/create-member-bet.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MEMBERS_MODEL, MEMBER_BETS_MODEL } from 'src/database/constants/constants';
import { Member, MemberBets } from './entities/member.entity';
import { Model } from 'mongoose';
import { HttpStatus, NotFoundException, ConflictException } from '@nestjs/common';

@Injectable()
export class MembersService {
  constructor(
    @Inject(MEMBERS_MODEL)
    private membersModel: Model<Member>,
    @Inject(MEMBER_BETS_MODEL) private memberBetsModel: Model<MemberBets>,
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


    const memberBets = new this.memberBetsModel({
      member_address: createMemberDto.member_address,
      bets: []
    });
    await memberBets.save();

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

   async getMemberBets(member_address: string) {
      const memberBets = await this.memberBetsModel.findOne({
        member_address,
      });

      if (!memberBets) {
        throw new NotFoundException('Member bets not found');
      }

      return memberBets;
    }


    async createMemberBet(dto: CreateMemberBetDto) {
      const { member_address, bet } = dto;

      const newBet = {
        ...bet,
        date: new Date()
      };

      return this.memberBetsModel.findOneAndUpdate(
        { member_address },               
        {
          $setOnInsert: { member_address }, 
          $push: { bets: newBet }        
        },
        {
          upsert: true,                    
          new: true
        }
      );
  }


}
