import { ApiProperty } from "@nestjs/swagger";

export class SetupDto {
    @ApiProperty()
    operator: string;

    @ApiProperty()
    asset_id: number;

    @ApiProperty()
    starting_block: number;

    @ApiProperty()
    daily_total_blocks: number;

    @ApiProperty()
    maximum_draws: number;

    @ApiProperty()
    maximum_bets: number;
}
