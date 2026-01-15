import { ApiProperty } from "@nestjs/swagger";

export class AddDrawJackpotDto {
  @ApiProperty()
  amount: number;
}