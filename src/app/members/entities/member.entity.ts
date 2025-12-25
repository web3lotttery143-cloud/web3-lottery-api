export class Member {
    member_address: String;
    upline_address: String;
}

export class Bet {
    bet_number: String;
    bet_amount: String;
    transaction_hash: String;
    date: Date;
    draw_number: String;
}

export class MemberBets {
    member_address: String;
    bets: Bet[];
}