import { ApiProperty } from "@nestjs/swagger";

export class ExecuteDrawJackpotDto {
  @ApiProperty()
  signed_hex: string;

  @ApiProperty()
  draw_number: number;

  @ApiProperty()
  jackpot: number;
}