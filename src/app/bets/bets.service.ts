import { Injectable } from '@nestjs/common';

import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { SubmittableExtrinsic } from '@polkadot/api/types';

import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';
import { ExecuteBetDto } from './dto/execute-bet.dto';
import { ISubmittableResult } from '@polkadot/types/types';

@Injectable()
export class BetsService {

  constructor(
    private readonly polkadotJsService: PolkadotjsService
  ) { }

  CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
  OPERATORS_MNEMONIC_SEEDS = process.env.OPERATORS_MNEMONIC_SEEDS || '';

  addBet(api: ApiPromise): SubmittableExtrinsic<'promise', ISubmittableResult> {
    this.polkadotJsService.validateConnection(api);
    this.polkadotJsService.validateConnection(api);

    const contractAddress = this.polkadotJsService.contractAddress;
    const amount = process.env.MIN_BET_AMOUNT || '0.5';
    const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

    const formattedAmount = api.createType(
      "Compact<u128>",
      amountInSmallestUnit
    );

    const transferExtrinsic = api.tx['assets']['transferKeepAlive'](
      1984,
      contractAddress,
      formattedAmount,
    );

    return transferExtrinsic;
  }

  async executeBet(api: ApiPromise, executeBetDto: ExecuteBetDto): Promise<string> {
    this.polkadotJsService.validateConnection(api);

    return new Promise((resolve, reject) => {
      (async () => {
        const extrinsic = api.createType('Extrinsic', executeBetDto.signed_hex);
        await api.tx(extrinsic).send(async (sendAssetResults: ISubmittableResult) => {
          if (sendAssetResults.isInBlock) {
            const txHashHex = sendAssetResults.status.asInBlock.toHex();

            const keyring = new Keyring({ type: "sr25519" });
            const operatorsMnemonicSeeds = keyring.addFromUri(this.OPERATORS_MNEMONIC_SEEDS);

            const contract = this.polkadotJsService.initContract(api);
            const gasLimit = this.polkadotJsService.createGasLimit(api);

            await contract.tx['addBet']({ gasLimit, storageDepositLimit: null },
              executeBetDto.draw_number,
              executeBetDto.bet_number,
              executeBetDto.bettor,
              executeBetDto.upline,
              txHashHex
            ).signAndSend(operatorsMnemonicSeeds, (addBetResults: ISubmittableResult) => {
              if (addBetResults.isInBlock) {
                resolve(addBetResults.status.asInBlock.toHex().toString());
              }

              if (addBetResults.isError) {
                reject(new Error(addBetResults.status.toString()));
              }
            }).catch((error) => {
              reject(new Error(error));
            });
          }

          if (sendAssetResults.isError) {
            reject(new Error(sendAssetResults.status.toString()));
          }
        }).catch((error) => {
          reject(new Error(error));
        });
      })();
    });
  }

  async getBets(api: ApiPromise, draw_number: number): Promise<string> {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractQuery = await contract.query['getBets'](
      this.polkadotJsService.contractAddress,
      { gasLimit, storageDepositLimit: null },
      draw_number
    );

    return JSON.stringify(contractQuery.output?.toHuman());
  }
}
