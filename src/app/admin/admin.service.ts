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

  async findBets(paginationQuery: PaginationQueryDto): Promise<PaginatedResult> {
    const limit = paginationQuery.limit || 20;
    const cursor = paginationQuery.cursor ? Buffer.from(paginationQuery.cursor, 'base64').toString('utf-8') : null;

    // Build the match pipeline stage to handle cursor
    const matchStage: any[] = [
      {
        $unwind: '$bets'
      },
      {
        $match: {
          'bets.success': true
        }
      }
    ];

    // Add cursor filter if cursor exists
    if (cursor) {
      const cursorData = JSON.parse(cursor);
      matchStage.push({
        $match: {
          $or: [
            {
              'bets.date': { $lt: new Date(cursorData.date) }
            },
            {
              'bets.date': { $eq: new Date(cursorData.date) },
              _id: { $lt: cursorData._id }
            }
          ]
        }
      });
    }

    const pipeline = [
      ...matchStage,
      {
        $project: {
          _id: 1,
          member_address: 1,
          bet_number: '$bets.bet_number',
          date: '$bets.date'
        }
      },
      {
        $sort: {
          'date': -1,
          '_id': -1
        }
      },
      {
        $limit: limit + 1 // Fetch one extra to determine hasMore
      }
    ];

    const results = await this.memberBetsModel.aggregate(pipeline);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    let nextCursor: string | null = null;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      const cursorData = {
        date: lastItem.date,
        _id: lastItem._id
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    return {
      data: data.map(item => ({
        member_address: item.member_address,
        bet_number: item.bet_number,
        date: item.date
      })),
      nextCursor,
      hasMore
    };
  }
}
