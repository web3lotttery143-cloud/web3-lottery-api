
import { Connection } from 'mongoose';
import { MembersSchema } from 'src/database/schemas/members.schema';
import { MEMBERS_MODEL } from 'src/database/constants/constants';

export const membersProviders = [
  {
    provide: MEMBERS_MODEL,
    useFactory: (connection: Connection) => connection.model('Members', MembersSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
