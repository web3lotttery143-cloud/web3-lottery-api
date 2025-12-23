import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberBetDto } from './create-member-bet.dto';

export class UpdateMemberBetDto extends PartialType(CreateMemberBetDto) {}