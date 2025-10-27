import dotenv from 'dotenv';
import Bet from '../models/Bet.js';
import Cycle from '../models/Cycle.js';
import User from '../models/User.js';
import SmartContractSimulator from '../services/smartContractSimulator.js';
import { DateScalar, Decimal128Scalar } from './scalars.js';

dotenv.config();

const OPERATOR_WALLET = process.env.OPERATOR_WALLET_ADDRESS?.toLowerCase();

const adjectives = [
  'Crypto',
  'Lucky',
  'Golden',
  'Quantum',
  'Cosmic',
  'Happy',
  'Clever',
  'Shiny',
  'Silent',
  'Witty',
];
const nouns = [
  'Whale',
  'Degen',
  'Panda',
  'Dragon',
  'Tiger',
  'Fox',
  'Star',
  'Moon',
  'Bot',
  'Wizard',
];

const generateRandomUsername = async () => {
  let username = '';
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 50) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(100 + Math.random() * 900);
    username = `${adj}${noun}${num}`;
    const existingUser = await User.findOne({ username: username });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) {
    username = `User${Date.now()}`;
  }
  return username;
};

const generateAvatarUrl = seed => {
  return `https://api.dicebear.com/8.x/pixel-art/svg?seed=${seed}`;
};

const checkAdmin = (walletAddress, signature) => {
  if (!walletAddress || walletAddress.toLowerCase() !== OPERATOR_WALLET) {
    throw new Error('Unauthorized: Wallet is not the operator.');
  }
  if (!signature || !signature.startsWith('sim-sig-')) {
    throw new Error('Unauthorized: Invalid signature.');
  }
};

const resolvers = {
  Date: DateScalar,
  Decimal: Decimal128Scalar,

  Query: {
    me: async (_, { walletAddress }) => {
      if (!walletAddress) return null;
      return await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    },
    currentCycle: async () => {
      return await Cycle.findOne({ status: 'OPEN' }).sort({ cycleNumber: -1 });
    },
    lastCompletedCycle: async () => {
      return await Cycle.findOne({ status: 'COMPLETED' }).sort({ cycleNumber: -1 });
    },
    cycleHistory: async (_, { page = 1, limit = 10 }) => {
      const skip = (page - 1) * limit;
      return await Cycle.find({ status: 'COMPLETED' })
        .sort({ cycleNumber: -1 })
        .skip(skip)
        .limit(limit);
    },
    adminStats: async () => {
      try {
        const currentCycle = await Cycle.findOne({ status: 'OPEN' }).sort({ cycleNumber: -1 });
        if (!currentCycle) {
          return {
            totalTicketsSoldCurrentCycle: 0,
            activePlayersCurrentCycle: 0,
            totalJackpotCurrentCycle: 0,
          };
        }
        const totalTickets = await Bet.countDocuments({ cycleNumber: currentCycle.cycleNumber });
        const distinctPlayers = await Bet.distinct('bettorWalletAddress', {
          cycleNumber: currentCycle.cycleNumber,
        });
        const activePlayers = distinctPlayers.length;
        return {
          totalTicketsSoldCurrentCycle: totalTickets,
          activePlayersCurrentCycle: activePlayers,
          totalJackpotCurrentCycle: currentCycle.totalJackpot,
        };
      } catch (error) {
        console.error('[Resolver] Error fetching adminStats:', error);
        throw new Error('Failed to fetch admin statistics.');
      }
    },
    myBets: async (_, { walletAddress, page = 1, limit = 10 }) => {
      const lowerCaseWalletAddress = walletAddress.toLowerCase();
      console.log(`[Resolver: myBets] Fetching for wallet: ${lowerCaseWalletAddress}`);
      try {
        const betsWithoutCycle = await Bet.find({ bettorWalletAddress: lowerCaseWalletAddress })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean();
        console.log(`[Resolver: myBets] Found ${betsWithoutCycle.length} raw bets.`);
        if (betsWithoutCycle.length === 0) {
          return [];
        }
        const cycleNumbers = [...new Set(betsWithoutCycle.map(bet => bet.cycleNumber))];
        const cycles = await Cycle.find({ cycleNumber: { $in: cycleNumbers } }).lean();
        const cycleMap = cycles.reduce((map, cycle) => {
          map[cycle.cycleNumber] = cycle;
          return map;
        }, {});
        const populatedBets = betsWithoutCycle
          .map(bet => {
            const cycle = cycleMap[bet.cycleNumber];
            if (cycle && bet._id) {
              const betWithId = { ...bet, id: bet._id.toString() };
              delete betWithId._id;
              const cycleWithId = { ...cycle, id: cycle._id.toString() };
              delete cycleWithId._id;
              return { ...betWithId, cycle: cycleWithId };
            } else {
              console.warn(
                `[Resolver: myBets] Skipping bet due to missing data. Bet ID: ${bet._id}, Cycle Number: ${bet.cycleNumber}`
              );
              return null;
            }
          })
          .filter(bet => bet !== null);
        console.log(`[Resolver: myBets] Returning ${populatedBets.length} valid populated bets.`);
        return populatedBets;
      } catch (error) {
        console.error('[Resolver: myBets] General error fetching bets:', error);
        return [];
      }
    },
  },

  Mutation: {
    registerUser: async (_, { walletAddress, referrer }) => {
      const lowerWalletAddress = walletAddress.toLowerCase();
      let user = await User.findOne({ walletAddress: lowerWalletAddress });

      if (!user) {
        const username = await generateRandomUsername();
        const profileImageUrl = generateAvatarUrl(lowerWalletAddress);
        console.log(
          `[Resolver: registerUser] New user: ${lowerWalletAddress}. Generated username: ${username}`
        );
        user = new User({
          walletAddress: lowerWalletAddress,
          username: username,
          profileImageUrl: profileImageUrl,
          referrerWalletAddress: referrer ? referrer.toLowerCase() : null,
        });
        await user.save();
      } else {
        console.log(`[Resolver: registerUser] Existing user found: ${lowerWalletAddress}`);
        let needsUpdate = false;
        if (!user.username) {
          user.username = await generateRandomUsername();
          console.log(`[Resolver: registerUser] Patching missing username: ${user.username}`);
          needsUpdate = true;
        }
        if (!user.profileImageUrl) {
          user.profileImageUrl = generateAvatarUrl(lowerWalletAddress);
          console.log(`[Resolver: registerUser] Patching missing profileImageUrl.`);
          needsUpdate = true;
        }
        if (needsUpdate) {
          await user.save();
        }
      }
      return user;
    },
    subscribeToNotifications: async (_, { walletAddress, token }) => {
      const lowerWalletAddress = walletAddress.toLowerCase();
      return await User.findOneAndUpdate(
        { walletAddress: lowerWalletAddress },
        { $addToSet: { pushNotificationTokens: token } },
        { new: true, upsert: true }
      );
    },
    placeBet: async (_, { walletAddress, selectedNumber, transactionHash }) => {
      if (selectedNumber.length !== 3) {
        throw new Error('Selected number must be exactly 3 digits.');
      }
      if (!transactionHash || !transactionHash.startsWith('sim-tx-')) {
        throw new Error('Invalid transaction hash. Simulation failed.');
      }
      const lowerWalletAddress = walletAddress.toLowerCase();
      let user = await User.findOne({ walletAddress: lowerWalletAddress });
      if (!user) {
        throw new Error('User not found. Please register before placing a bet.');
      }
      return SmartContractSimulator.placeBet({
        walletAddress: lowerWalletAddress,
        selectedNumber,
        referrer: user.referrerWalletAddress,
        transactionHash: transactionHash,
      });
    },
    closeCurrentCycle: async (_, { walletAddress, signature }) => {
      checkAdmin(walletAddress, signature);
      const currentCycle = await Cycle.findOne({ status: 'OPEN' }).sort({ cycleNumber: -1 });
      if (!currentCycle) {
        throw new Error('No open cycle found to close.');
      }
      currentCycle.status = 'CLOSED';
      await currentCycle.save();
      return currentCycle;
    },

    triggerDraw: async (_, { walletAddress, signature, winningNumber }) => {
      checkAdmin(walletAddress, signature);
      // Pass the optional winningNumber to the simulator
      return SmartContractSimulator.triggerDraw({ forcedWinningNumber: winningNumber });
    },
  },
};

export default resolvers;
