import { ApiProperty } from "@nestjs/swagger";

export class CloseDrawDto {
  @ApiProperty()
  draw_number: number;
}
