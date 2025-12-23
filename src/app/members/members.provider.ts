
import { Connection } from 'mongoose';
import { MembersSchema } from 'src/database/schemas/members.schema';
import { MemberBetsSchema } from 'src/database/schemas/bets.schema';
import { MEMBERS_MODEL, MEMBER_BETS_MODEL } from 'src/database/constants/constants';

export const membersProviders = [
  {
    provide: MEMBERS_MODEL,
    useFactory: (connection: Connection) => connection.model('Members', MembersSchema),
    inject: ['DATABASE_CONNECTION'],
  },

  {
    provide: MEMBER_BETS_MODEL,
    useFactory: (connection: Connection) => connection.model('Member-Bets', MemberBetsSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
