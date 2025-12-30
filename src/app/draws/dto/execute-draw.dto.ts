import { ApiProperty } from "@nestjs/swagger";

export class ExecuteDrawDto {
  @ApiProperty()
  signed_hex: string;
}