import { ApiProperty } from "@nestjs/swagger";

export class CreateMemberDto {
    @ApiProperty()
    member_address: String;

    @ApiProperty()
    upline_address: String;
}
