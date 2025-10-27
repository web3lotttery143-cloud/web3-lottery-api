const typeDefs = `#graphql
  scalar Date
  scalar Decimal

  type AdminStats {
    totalTicketsSoldCurrentCycle: Int!
    activePlayersCurrentCycle: Int!
    totalJackpotCurrentCycle: Decimal!
  }

  type Query {
    me(walletAddress: String!): User
    currentCycle: Cycle
    lastCompletedCycle: Cycle
    cycleHistory(page: Int, limit: Int): [Cycle]
    myBets(walletAddress: String!, page: Int, limit: Int): [Bet]
    adminStats: AdminStats
  }

  type Mutation {
    registerUser(walletAddress: String!, referrer: String): User
    subscribeToNotifications(walletAddress: String!, token: String!): User


    placeBet(
      walletAddress: String!
      selectedNumber: String!
      transactionHash: String!
    ): Bet


    closeCurrentCycle(walletAddress: String!, signature: String!): Cycle
    triggerDraw(walletAddress: String!, signature: String!, winningNumber: String): Cycle
  }

  type User {
    id: ID!
    walletAddress: String!
    username: String!
    profileImageUrl: String!
    referrerWalletAddress: String
    totalAffiliateEarnings: Decimal!
    totalRebates: Decimal!
    createdAt: Date
  }

  type Cycle {
    id: ID!
    cycleNumber: Int!
    status: String!
    totalJackpot: Decimal!
    operatorBalance: Decimal!
    transactionFeeBalance: Decimal!
    totalBets: Int!
    winningNumber: String
    drawMethod: String
    totalWinners: Int
    jackpotRolledOver: Boolean
    startedAt: Date
    endedAt: Date
  }

  type Bet {
    id: ID!
    cycle: Cycle!
    bettorWalletAddress: String!
    selectedNumber: String!
    transactionHash: String!
    createdAt: Date
    rebateCredited: Decimal
  }
`;

export default typeDefs;
