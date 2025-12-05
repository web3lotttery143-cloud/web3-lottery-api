import { ApiProperty } from "@nestjs/swagger";

export class AddDrawDto {
  @ApiProperty()
  opening_blocks: number;

  @ApiProperty()
  processing_blocks: number;

  @ApiProperty()
  closing_blocks: number;

  @ApiProperty()
  bet_amount: number;
}
