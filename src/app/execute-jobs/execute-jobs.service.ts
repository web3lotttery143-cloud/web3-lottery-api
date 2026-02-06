import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';
import { Keyring } from '@polkadot/keyring';
import { ApiPromise } from '@polkadot/api';

@Injectable()
export class ExecuteJobsService {
  private readonly logger = new Logger(ExecuteJobsService.name);

  constructor(
    private readonly polkadotJsService: PolkadotjsService,
  ) { }

  CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
  DEVELOPERS_MNEMONIC_SEEDS = process.env.DEVELOPERS_MNEMONIC_SEEDS || '';
  OPERATORS_MNEMONIC_SEEDS = process.env.OPERATORS_MNEMONIC_SEEDS || '';

  private pjsApi: ApiPromise | null = null;

  private isJobRunning = true;
  private isProcessingBlock = false;

  private isLotterySetupProcessed = false;

  private truncateMiddle(str, head = 5, tail = 5) {
    if (typeof str !== 'string') return String(str ?? '');
    if (str.length <= head + tail + 3) return str;
    return `${str.slice(0, head)}...${str.slice(-tail)}`;
  }

  @Cron('*/10 * * * * *')
  async executeLotteryJob() {
    try {
      if (!this.isJobRunning) {
        this.logger.log('Lottery job is not running. Skipping execution.');
        return;
      }

      if (this.pjsApi !== null) {
        if (!this.pjsApi.isConnected) {
          await this.pjsApi.connect();
        }
      } else {
        this.pjsApi = await this.polkadotJsService.connect();
      }

      this.polkadotJsService.validateConnection(this.pjsApi);

      if (!this.isProcessingBlock) {
        this.isProcessingBlock = true;

        const block = await this.pjsApi.rpc.chain.getBlock();
        const currentBlock = block.block.header.number.toNumber();

        const keyring = new Keyring({ type: "sr25519", ss58Format: 280 });
        const operatorsMnemonicSeeds = keyring.addFromMnemonic(this.OPERATORS_MNEMONIC_SEEDS);

        const contract = this.polkadotJsService.initContract(this.pjsApi);
        const gasLimit = this.polkadotJsService.createGasLimit(this.pjsApi);

        const now = new Date();

        if (now.getHours() >= 5 && now.getHours() < 6 && !this.isLotterySetupProcessed) {
          this.logger.log(`Block #${currentBlock} | Checking lottery setup at 5AM`);

          const getLotterySetup = await contract.query['getLotterySetup'](
            this.CONTRACT_ADDRESS, { gasLimit, storageDepositLimit: null }
          );

          if (getLotterySetup.output) {
            const developersMnemonicSeeds = keyring.addFromMnemonic(this.DEVELOPERS_MNEMONIC_SEEDS);

            const lottery = getLotterySetup.output.toJSON() as any;
            const dailyTotalBlocks = Number(lottery.ok?.dailyTotalBlocks.toString().replace(/,/g, ''));
            const maximumDraws = Number(lottery.ok?.maximumDraws.toString().replace(/,/g, ''));
            const maximumBets = Number(lottery.ok?.maximumBets.toString().replace(/,/g, ''));

            try {
              const result = await contract.tx['setup']({ gasLimit, storageDepositLimit: null },
                operatorsMnemonicSeeds.address,
                1984,
                currentBlock + 600,
                dailyTotalBlocks,
                maximumDraws,
                maximumBets,
              ).signAndSend(developersMnemonicSeeds);
              this.logger.log(`Block #${currentBlock} | Setup Lottery status: ${result.toHex().toString()}`);

              this.isLotterySetupProcessed = true;
            } catch (error) {
              this.logger.error(`Block #${currentBlock} | Failed to setup lottery: ${error.message}`);
            }
          }
        }

        if (now.getHours() >= 6) {
          this.isLotterySetupProcessed = false;
        }

        const newLotterySetup = await contract.query['getLotterySetup'](
          this.CONTRACT_ADDRESS, { gasLimit, storageDepositLimit: null }
        );

        if (newLotterySetup.output) {
          const lottery = newLotterySetup.output.toJSON() as any;
          this.logger.log(`Block #${currentBlock} | Lottery ${this.truncateMiddle(this.CONTRACT_ADDRESS)} (${lottery.ok?.isStarted}): [${lottery.ok?.startingBlock}, ${lottery.ok?.nextStartingBlock}] O:${this.truncateMiddle(lottery.ok?.operator)}, D:${this.truncateMiddle(lottery.ok?.dev)}`);

          const startingBlock = Number(lottery.ok?.startingBlock.toString().replace(/,/g, ''));
          const nextStartingBlock = Number(lottery.ok?.nextStartingBlock.toString().replace(/,/g, ''));

          const getDraws = await contract.query['getDraws'](
            this.CONTRACT_ADDRESS, { gasLimit, storageDepositLimit: null }
          );

          if (getDraws.output) {
            const draws = getDraws.output.toJSON() as any;

            draws.ok?.map(async (d: any) => {
              const openingBlocks = (Number(d.openingBlocks.toString().replace(/,/g, '')) * 2) + startingBlock;
              const processingBlocks = (Number(d.processingBlocks.toString().replace(/,/g, '')) * 2) + startingBlock;
              const closingBlocks = (Number(d.closingBlocks.toString().replace(/,/g, '')) * 2) + startingBlock;

              if (!d.isOpen && d.status == "Close" && currentBlock >= openingBlocks) {
                if (currentBlock < closingBlocks) {
                  try {
                    const result = await contract.tx['openDraw']({ gasLimit, storageDepositLimit: null },
                      d.drawNumber,
                    ).signAndSend(operatorsMnemonicSeeds);
                    this.logger.log(`Block #${currentBlock} | Open Draw #${d.drawNumber} status: ${result.toHex().toString()}`);
                  } catch (error) {
                    this.logger.error(`Block #${currentBlock} | Failed to open draw #${d.drawNumber}: ${error.message}`);
                  }
                }
              }

              if (d.isOpen && d.status == "Open" && currentBlock >= processingBlocks) {
                try {
                  const result = await contract.tx['processDraw']({ gasLimit, storageDepositLimit: null },
                    d.drawNumber,
                  ).signAndSend(operatorsMnemonicSeeds);
                  this.logger.log(`Block #${currentBlock} | Process Draw #${d.drawNumber} status: ${result.toHex().toString()}`);
                } catch (error) {
                  this.logger.error(`Block #${currentBlock} | Failed to process draw #${d.drawNumber}: ${error.message}`);
                }
              }

              if (!d.isOpen && d.status == "Processing" && currentBlock >= closingBlocks) {
                try {
                  const result = await contract.tx['closeDraw']({ gasLimit, storageDepositLimit: null },
                    d.drawNumber,
                  ).signAndSend(operatorsMnemonicSeeds);
                  this.logger.log(`Block #${currentBlock} | Close Draw #${d.drawNumber} status: ${result.toHex().toString()}`);
                } catch (error) {
                  this.logger.error(`Block #${currentBlock} | Failed to close draw #${d.drawNumber}: ${error.message}`);
                }
              }

              const jackpot = Number(d.jackpot.toString().replace(/,/g, '')) / 1000000;
              this.logger.log(`Block #${currentBlock} | [Draw: #${d.drawNumber} (${d.status}, ${d.isOpen}, O:${openingBlocks}, P:${processingBlocks}, C:${closingBlocks}): ` +
                `Pot:${jackpot}USDT Bets:${d.bets.length} Win#:${d.winningNumber} Winners:${d.winners.length}]`);
            });
          }

          if (!lottery.ok?.isStarted && currentBlock >= startingBlock) {
            try {
              const result = await contract.tx['start']({ gasLimit, storageDepositLimit: null }).signAndSend(operatorsMnemonicSeeds);
              this.logger.log(`Block #${currentBlock} | Start Lottery status: ${result.toHex().toString()}`);
            } catch (error) {
              this.logger.error(`Block #${currentBlock} | Failed to start lottery: ${error.message}`);
            }
          }

          if (lottery.ok?.isStarted && currentBlock >= nextStartingBlock) {
            try {
              const result = await contract.tx['stop']({ gasLimit, storageDepositLimit: null }).signAndSend(operatorsMnemonicSeeds);
              this.logger.log(`Block #${currentBlock} | Stop Lottery status: ${result.toHex().toString()}`);
            } catch (error) {
              this.logger.error(`Block #${currentBlock} | Failed to stop lottery: ${error.message}`);
            }
          }
        }

        this.isProcessingBlock = false;
      }
    } catch (error) {
      this.logger.error(`Error executing lottery job: ${error.message}`);
    }
  }
}