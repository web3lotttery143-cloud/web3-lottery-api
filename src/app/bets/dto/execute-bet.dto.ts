import { ApiProperty } from "@nestjs/swagger";

export class ExecuteBetDto {
  @ApiProperty()
  signed_hex: string;

  @ApiProperty()
  draw_number: number;

  @ApiProperty()
  bet_number: number;

  @ApiProperty()
  bettor: string;

  @ApiProperty()
  upline: string;
}
