import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';
import { Keyring } from '@polkadot/keyring';

@Injectable()
export class ExecuteJobsService {

  constructor(
    private readonly polkadotJsService: PolkadotjsService,
  ) { }

  private readonly logger = new Logger(ExecuteJobsService.name);
  private isRunning = false;

  CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
  OPERATORS_MNEMONIC_SEEDS = process.env.OPERATORS_MNEMONIC_SEEDS || '';

  @Cron('*/60 * * * * *')
  async handleLotteryJobs() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      this.logger.debug('Lottery job started.');
      await this.executeLotteryJobs();

      this.logger.debug('Lottery job finished.');
    } catch (error) {
      this.logger.error('Lottery job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private truncateMiddle(str, head = 5, tail = 5) {
    if (typeof str !== 'string') return String(str ?? '');
    if (str.length <= head + tail + 3) return str;
    return `${str.slice(0, head)}...${str.slice(-tail)}`;
  }

  private async executeLotteryJobs() {
    const api = await this.polkadotJsService.connect();
    this.polkadotJsService.validateConnection(api);

    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const keyring = new Keyring({ type: "sr25519" });
    const operatorsMnemonicSeeds = keyring.addFromUri(this.OPERATORS_MNEMONIC_SEEDS);

    await api.rpc.chain.subscribeNewHeads(async (header) => {
      const currentBlock = header.number.toNumber();

      const getLotterySetup = await contract.query['getLotterySetup'](
        this.CONTRACT_ADDRESS, { gasLimit, storageDepositLimit: null }
      );
      if (getLotterySetup.output) {
        const lottery = getLotterySetup.output.toJSON() as any;
        Logger.log(`Block #${currentBlock} | Lottery ${this.truncateMiddle(this.CONTRACT_ADDRESS)} (${lottery.ok?.isStarted}): [${lottery.ok?.startingBlock}, ${lottery.ok?.nextStartingBlock}] O:${this.truncateMiddle(lottery.ok?.operator)}, D:${this.truncateMiddle(lottery.ok?.dev)}`);

        const startingBlock = Number(lottery.ok?.startingBlock.toString().replace(/,/g, ''));
        const nextStartingBlock = Number(lottery.ok?.nextStartingBlock.toString().replace(/,/g, ''));

        const getDraws = await contract.query['getDraws'](
          this.CONTRACT_ADDRESS, { gasLimit, storageDepositLimit: null }
        );
        if (getDraws.output) {
          const draws = getDraws.output.toJSON() as any;
          draws.ok?.map(d => {
            const openingBlocks = Number(d.openingBlocks.toString().replace(/,/g, '')) + startingBlock;
            const processingBlocks = Number(d.processingBlocks.toString().replace(/,/g, '')) + startingBlock;
            const closingBlocks = Number(d.closingBlocks.toString().replace(/,/g, '')) + startingBlock;

            if (!d.isOpen && d.status == "Close" && currentBlock >= openingBlocks) {
              if (currentBlock < closingBlocks) {
                contract.tx['openDraw']({ gasLimit, storageDepositLimit: null },
                  d.drawNumber,
                ).signAndSend(operatorsMnemonicSeeds, (result) => {
                  Logger.log(`Block #${currentBlock} | Open Draw #${d.drawNumber} status: ${result.status.toString()}`);
                }).catch((error) => {
                  Logger.error(`Block #${currentBlock} | Failed to open draw #${d.drawNumber}: ${error.message}`);
                });
              }
            }

            if (d.isOpen && d.status == "Open" && currentBlock >= processingBlocks) {
              contract.tx['processDraw']({ gasLimit, storageDepositLimit: null },
                d.drawNumber,
              ).signAndSend(operatorsMnemonicSeeds, (result) => {
                Logger.log(`Block #${currentBlock} | Process Draw #${d.drawNumber} status: ${result.status.toString()}`);
              }).catch((error) => {
                Logger.error(`Block #${currentBlock} | Failed to process draw #${d.drawNumber}: ${error.message}`);
              });
            }

            if (!d.isOpen && d.status == "Processing" && currentBlock >= closingBlocks) {
              contract.tx['closeDraw']({ gasLimit, storageDepositLimit: null },
                d.drawNumber,
              ).signAndSend(operatorsMnemonicSeeds, (result) => {
                Logger.log(`Block #${currentBlock} | Close Draw #${d.drawNumber} status: ${result.status.toString()}`);
              }).catch((error) => {
                Logger.error(`Block #${currentBlock} | Failed to close draw #${d.drawNumber}: ${error.message}`);
              });
            }

            const jackpot = Number(d.jackpot.toString().replace(/,/g, '')) / 1000000;

            Logger.log(`Block #${currentBlock} | [Draw: #${d.drawNumber} (${d.status}, ${d.isOpen}, O:${openingBlocks}, P:${processingBlocks}, C:${closingBlocks}): ` +
              `Pot:${jackpot}USDT Bets:${d.bets.length} Win#:${d.winningNumber} Winners:${d.winners.length}]`);
          });
        }

        if (!lottery.ok?.isStarted && currentBlock >= startingBlock) {
          contract.tx['start']({ gasLimit, storageDepositLimit: null })
            .signAndSend(operatorsMnemonicSeeds, (result) => {
              Logger.log(`Block #${currentBlock} | Start Lottery status: ${result.status.toString()}`);
            }).catch((error) => {
              Logger.error(`Block #${currentBlock} | Failed to start lottery: ${error.message}`);
            });
        }

        if (lottery.ok?.isStarted && currentBlock >= nextStartingBlock) {
          contract.tx['stop']({ gasLimit, storageDepositLimit: null })
            .signAndSend(operatorsMnemonicSeeds, (result) => {
              Logger.log(`Block #${currentBlock} | Stop Lottery status: ${result.status.toString()}`);
            }).catch((error) => {
              Logger.error(`Block #${currentBlock} | Failed to stop lottery: ${error.message}`);
            });
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}