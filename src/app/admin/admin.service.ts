import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { MEMBER_BETS_MODEL } from 'src/database/constants/constants';
import { Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { MemberBets } from '../members/entities/member.entity';
import { PaginationQueryDto } from './dto/pagination-query.dto';

export interface PaginatedResult {
  data: any[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(MEMBER_BETS_MODEL) private memberBetsModel: Model<MemberBets>
  ) {}

  async findBets() {
    return await this.memberBetsModel.aggregate([
      {
    $unwind: '$bets'
      },
      {
        $match: {
          'bets.success': true
        }
      },
      {
        $project: {
          _id: 0,
          member_address: 1,
          bet_number: '$bets.bet_number',
          draw_number: '$bets.draw_number',
          date: '$bets.date'
        }
      }
    ])
  }
}
