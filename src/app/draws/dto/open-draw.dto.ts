import { ApiProperty } from "@nestjs/swagger";

export class OpenDrawDto {
  @ApiProperty()
  draw_number: number;
}
