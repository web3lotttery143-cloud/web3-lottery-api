import { ApiProperty } from "@nestjs/swagger";

export class BetDto {
  @ApiProperty()
  bet_number: number;

  @ApiProperty()
  bet_amount: number;

  @ApiProperty()
  transaction_hash: string;

  @ApiProperty()
  draw_number: number;
}

export class CreateMemberBetDto {
  @ApiProperty()
  member_address: string;

  @ApiProperty()
  bet: BetDto;
}
