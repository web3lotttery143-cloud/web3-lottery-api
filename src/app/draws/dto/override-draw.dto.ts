import { ApiProperty } from "@nestjs/swagger";

export class OverrideDrawDto {
  @ApiProperty()
  draw_number: number;

  @ApiProperty()
  winning_number: number;
}
