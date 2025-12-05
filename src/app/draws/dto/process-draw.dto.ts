import { ApiProperty } from "@nestjs/swagger";

export class ProcessDrawDto {
  @ApiProperty()
  draw_number: number;
}
