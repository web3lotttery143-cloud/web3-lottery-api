import mongoose from 'mongoose';
import Bet from '../models/Bet.js';
import Cycle from '../models/Cycle.js';
import User from '../models/User.js';
import Winner from '../models/Winner.js';

const BET_PRICE = 0.5;
const JACKPOT_SHARE_PERCENT = 0.5;
const OPERATOR_SHARE_PERCENT = 0.2;
const AFFILIATE_SHARE_PERCENT = 0.1;
const REBATE_SHARE_PERCENT = 0.1;
const TX_FEE_SHARE_PERCENT = 0.1;

const JACKPOT_AMOUNT_PER_BET = BET_PRICE * JACKPOT_SHARE_PERCENT;
const OPERATOR_AMOUNT_PER_BET = BET_PRICE * OPERATOR_SHARE_PERCENT;
const AFFILIATE_AMOUNT_PER_BET = BET_PRICE * AFFILIATE_SHARE_PERCENT;
const REBATE_AMOUNT_PER_BET = BET_PRICE * REBATE_SHARE_PERCENT;
const TX_FEE_AMOUNT_PER_BET = BET_PRICE * TX_FEE_SHARE_PERCENT;

const MAX_BETS_PER_CYCLE = 10000;

const canUseTransactions = process.env.NODE_ENV === 'production';

const addDecimal128 = (d1, valueToAdd) => {
  const current = d1 instanceof mongoose.Types.Decimal128 ? parseFloat(d1.toString()) : 0.0;
  const addition = typeof valueToAdd === 'number' ? valueToAdd : 0.0;
  return mongoose.Types.Decimal128.fromString((current + addition).toString());
};

class SmartContractSimulator {
  static async placeBet({ walletAddress, selectedNumber, referrer, transactionHash }) {
    const session = canUseTransactions ? await mongoose.startSession() : null;
    if (session) session.startTransaction();
    try {
      const bettorAddress = walletAddress.toLowerCase();
      const referrerAddress = referrer ? referrer.toLowerCase() : null;

      let currentCycle = await Cycle.findOne({ status: 'OPEN' }).session(session);
      if (!currentCycle) {
        const lastCycle = await Cycle.findOne().sort({ cycleNumber: -1 }).session(session);
        const newCycleNumber = lastCycle ? lastCycle.cycleNumber + 1 : 1;
        console.log(`[Simulator] No open cycle found. Creating new cycle #${newCycleNumber}.`);
        currentCycle = new Cycle({
          cycleNumber: newCycleNumber,
          status: 'OPEN',
          totalJackpot: mongoose.Types.Decimal128.fromString('0.0'),
          operatorBalance: mongoose.Types.Decimal128.fromString('0.0'),
          transactionFeeBalance: mongoose.Types.Decimal128.fromString('0.0'),
          totalBets: 0,
        });
        await currentCycle.save({ session });
      }

      if (currentCycle.totalBets >= MAX_BETS_PER_CYCLE)
        throw new Error('Current lottery cycle is full.');

      const existingBet = await Bet.findOne({
        cycleNumber: currentCycle.cycleNumber,
        bettorWalletAddress: bettorAddress,
      }).session(session);

      if (existingBet) {
        throw new Error(
          `Wallet ${bettorAddress} has already placed a bet in cycle ${currentCycle.cycleNumber}.`
        );
      }

      const newBet = new Bet({
        cycleNumber: currentCycle.cycleNumber,
        bettorWalletAddress: bettorAddress,
        selectedNumber: selectedNumber,
        transactionHash: transactionHash,
        rebateCredited: mongoose.Types.Decimal128.fromString(REBATE_AMOUNT_PER_BET.toString()),
        betAmount: mongoose.Types.Decimal128.fromString(BET_PRICE.toString()),
      });
      await newBet.save({ session });
      console.log(
        `[Simulator] Bet saved for ${bettorAddress} in cycle ${currentCycle.cycleNumber}`
      );

      const bettorUser = await User.findOne({ walletAddress: bettorAddress }).session(session);
      if (bettorUser) {
        const newRebates = addDecimal128(bettorUser.totalRebates, REBATE_AMOUNT_PER_BET);
        await User.updateOne(
          { _id: bettorUser._id },
          { $set: { totalRebates: newRebates } },
          { session }
        );
        console.log(
          `[Simulator] Credited rebate ${REBATE_AMOUNT_PER_BET} to ${bettorAddress}. New total: ${newRebates}`
        );
      }

      if (referrerAddress && referrerAddress !== bettorAddress) {
        console.log(
          `[Simulator] AFFILIATE LOGIC START: Bettor ${bettorAddress} was referred by ${referrerAddress}.`
        );

        const referrerUser = await User.findOne({ walletAddress: referrerAddress }).session(
          session
        );
        if (referrerUser) {
          console.log(
            `[Simulator] Referrer found. Current earnings: ${referrerUser.totalAffiliateEarnings.toString()}`
          );

          const newEarnings = addDecimal128(
            referrerUser.totalAffiliateEarnings,
            AFFILIATE_AMOUNT_PER_BET
          );

          await User.updateOne(
            { _id: referrerUser._id },
            { $set: { totalAffiliateEarnings: newEarnings } },
            { session }
          );

          const updatedReferrerUser = await User.findOne({
            walletAddress: referrerAddress,
          }).session(session);
          console.log(
            `[Simulator] Credited affiliate ${AFFILIATE_AMOUNT_PER_BET} to ${referrerAddress}. New total should be: ${newEarnings.toString()}`
          );
          console.log(
            `[Simulator] VERIFICATION: Value in DB is now: ${updatedReferrerUser.totalAffiliateEarnings.toString()}`
          );
        } else {
          console.warn(`[Simulator] Referrer ${referrerAddress} not found in database.`);
        }
      } else {
        console.log(`[Simulator] No referrer for this bet, or bettor is their own referrer.`);
      }

      currentCycle.totalBets += 1;
      currentCycle.totalJackpot = addDecimal128(currentCycle.totalJackpot, JACKPOT_AMOUNT_PER_BET);
      currentCycle.operatorBalance = addDecimal128(
        currentCycle.operatorBalance,
        OPERATOR_AMOUNT_PER_BET
      );
      currentCycle.transactionFeeBalance = addDecimal128(
        currentCycle.transactionFeeBalance,
        TX_FEE_AMOUNT_PER_BET
      );

      console.log(
        `[Simulator] Cycle ${currentCycle.cycleNumber} updated: Bets=${currentCycle.totalBets}, Jackpot=${currentCycle.totalJackpot}`
      );

      if (currentCycle.totalBets >= MAX_BETS_PER_CYCLE) {
        currentCycle.status = 'CLOSED';
        console.log(
          `[Simulator] Cycle ${currentCycle.cycleNumber} reached max bets and is now CLOSED.`
        );
      }
      await currentCycle.save({ session });

      if (session) await session.commitTransaction();
      return newBet;
    } catch (error) {
      if (session) await session.abortTransaction();
      console.error('[Simulator] Error during placeBet:', error.message);
      throw error;
    } finally {
      if (session) session.endSession();
    }
  }

  static async triggerDraw({ forcedWinningNumber } = {}) {
    const session = canUseTransactions ? await mongoose.startSession() : null;
    if (session) session.startTransaction();
    try {
      const cycleToDraw = await Cycle.findOne({ status: 'CLOSED' })
        .sort({ cycleNumber: 1 })
        .session(session);
      if (!cycleToDraw) throw new Error('No closed cycle found to draw.');
      console.log(`[Simulator] Starting draw for cycle ${cycleToDraw.cycleNumber}`);

      let winningNumber;
      if (forcedWinningNumber && forcedWinningNumber.length === 3) {
        winningNumber = forcedWinningNumber;
        cycleToDraw.drawMethod = 'MANUAL';
        console.log(
          `[Simulator] Using FORCED winning number for cycle ${cycleToDraw.cycleNumber}: ${winningNumber}`
        );
      } else {
        winningNumber = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0');
        cycleToDraw.drawMethod = 'VRF';
        console.log(
          `[Simulator] Generated RANDOM winning number for cycle ${cycleToDraw.cycleNumber}: ${winningNumber}`
        );
      }

      cycleToDraw.winningNumber = winningNumber;

      const winningBets = await Bet.find({
        cycleNumber: cycleToDraw.cycleNumber,
        selectedNumber: winningNumber,
      }).session(session);
      console.log(`[Simulator] Found ${winningBets.length} winning bets.`);

      let jackpotRolledOver = true;
      let nextCycleJackpot = cycleToDraw.totalJackpot;

      if (winningBets.length > 0) {
        jackpotRolledOver = false;
        nextCycleJackpot = mongoose.Types.Decimal128.fromString('0.0');
        cycleToDraw.totalWinners = winningBets.length;
        const totalJackpotAmount = parseFloat(cycleToDraw.totalJackpot.toString());
        const jackpotPerWinner = totalJackpotAmount / winningBets.length;

        for (const bet of winningBets) {
          const winnerUser = await User.findOne({ walletAddress: bet.bettorWalletAddress }).session(
            session
          );
          if (!winnerUser) continue;

          const winnerJackpotShareAmount = jackpotPerWinner * 0.95;
          const referrerJackpotShareAmount = jackpotPerWinner * 0.05;

          const winnerDoc = new Winner({
            cycleNumber: cycleToDraw.cycleNumber,
            winnerWalletAddress: winnerUser.walletAddress,
            uplineWalletAddress: winnerUser.referrerWalletAddress,
            jackpotShare: mongoose.Types.Decimal128.fromString(
              winnerJackpotShareAmount.toFixed(18)
            ),
            uplineShare: mongoose.Types.Decimal128.fromString(
              referrerJackpotShareAmount.toFixed(18)
            ),
            payoutTxHash: `sim-payout-${Date.now()}-${Math.random()}`,
          });
          await winnerDoc.save({ session });

          if (winnerUser.referrerWalletAddress) {
            const referrerUser = await User.findOne({
              walletAddress: winnerUser.referrerWalletAddress,
            }).session(session);
            if (referrerUser) {
              const newTotalEarnings = addDecimal128(
                referrerUser.totalAffiliateEarnings,
                referrerJackpotShareAmount
              );
              await User.updateOne(
                { _id: referrerUser._id },
                { $set: { totalAffiliateEarnings: newTotalEarnings } },
                { session }
              );
              console.log(
                `[Simulator] Credited Jackpot Bonus ${referrerJackpotShareAmount} to referrer ${winnerUser.referrerWalletAddress}`
              );
            }
          }
        }
      } else {
        cycleToDraw.totalWinners = 0;
        console.log(
          `[Simulator] No winners found. Jackpot ${cycleToDraw.totalJackpot} rolls over.`
        );
      }

      cycleToDraw.status = 'COMPLETED';
      cycleToDraw.endedAt = new Date();
      cycleToDraw.jackpotRolledOver = jackpotRolledOver;
      await cycleToDraw.save({ session });
      console.log(`[Simulator] Cycle ${cycleToDraw.cycleNumber} marked as COMPLETED.`);

      const nextCycle = new Cycle({
        cycleNumber: cycleToDraw.cycleNumber + 1,
        status: 'OPEN',
        totalJackpot: nextCycleJackpot,
        operatorBalance: mongoose.Types.Decimal128.fromString('0.0'),
        transactionFeeBalance: mongoose.Types.Decimal128.fromString('0.0'),
        totalBets: 0,
        startedAt: new Date(),
      });
      await nextCycle.save({ session });
      console.log(
        `[Simulator] Next cycle ${nextCycle.cycleNumber} created with starting jackpot ${nextCycle.totalJackpot}.`
      );

      if (session) await session.commitTransaction();

      // UNCOMMENT IF NEEDED: 🚨 Asynchronously clean up the completed cycle data
      // SmartContractSimulator.cleanupCycleData(cycleToDraw.cycleNumber)
      //   .then(result =>
      //     console.log(
      //       `[Simulator] Auto-cleanup successful for cycle #${cycleToDraw.cycleNumber}. Deleted Bets: ${result.betsDeleted}, Winners: ${result.winnersDeleted}`
      //     )
      //   )
      //   .catch(err =>
      //     console.error(
      //       `[Simulator] Auto-cleanup failed for cycle #${cycleToDraw.cycleNumber}:`,
      //       err
      //     )
      //   );

      return cycleToDraw;
    } catch (error) {
      if (session) await session.abortTransaction();
      console.error('[Simulator] Error during triggerDraw:', error.message);
      throw error;
    } finally {
      if (session) session.endSession();
    }
  }

  static async cleanupCycleData(cycleNumber) {
    if (typeof cycleNumber !== 'number' || cycleNumber <= 0 || !Number.isInteger(cycleNumber)) {
      const errorMsg = `Invalid cycle number provided: ${cycleNumber}`;
      console.error(`[Simulator: cleanup] ${errorMsg}`);
      return { betsDeleted: 0, winnersDeleted: 0, error: errorMsg };
    }

    console.log(`[Simulator: cleanup] Starting cleanup for cycle ${cycleNumber}...`);
    let betsDeleted = 0;
    let winnersDeleted = 0;

    try {
      const betDeletionResult = await Bet.deleteMany({ cycleNumber: cycleNumber });
      betsDeleted = betDeletionResult.deletedCount || 0;
      console.log(
        `[Simulator: cleanup] Deleted ${betsDeleted} Bet documents for cycle ${cycleNumber}.`
      );

      const winnerDeletionResult = await Winner.deleteMany({ cycleNumber: cycleNumber });
      winnersDeleted = winnerDeletionResult.deletedCount || 0;
      console.log(
        `[Simulator: cleanup] Deleted ${winnersDeleted} Winner documents for cycle ${cycleNumber}.`
      );

      console.log(`[Simulator: cleanup] Cleanup finished successfully for cycle ${cycleNumber}.`);
      return { betsDeleted, winnersDeleted, error: null };
    } catch (error) {
      console.error(`[Simulator: cleanup] Error during cleanup for cycle ${cycleNumber}:`, error);
      return { betsDeleted, winnersDeleted, error: error.message };
    }
  }
}

export default SmartContractSimulator;
