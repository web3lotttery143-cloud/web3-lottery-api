import { Injectable } from '@nestjs/common';

import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';
import { AddDrawDto } from './dto/add-draw.dto';
import { OpenDrawDto } from './dto/open-draw.dto';
import { ProcessDrawDto } from './dto/process-draw.dto';
import { OverrideDrawDto } from './dto/override-draw.dto';
import { CloseDrawDto } from './dto/close-draw.dto';
import { ExecuteDrawDto } from './dto/execute-draw.dto';

import { AddDrawJackpotDto } from '../bets/dto/add-draw-jackpot.dto';
import { ExecuteDrawJackpotDto } from '../bets/dto/execute-draw-jackpot.dto';

@Injectable()
export class DrawsService {

  constructor(
    private readonly polkadotJsService: PolkadotjsService
  ) { }

  CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
  OPERATORS_MNEMONIC_SEEDS = process.env.OPERATORS_MNEMONIC_SEEDS || '';

  addDraw(api: ApiPromise, addDrawDto: AddDrawDto): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['addDraw'](
      { gasLimit, storageDepositLimit: null },
      addDrawDto.opening_blocks,
      addDrawDto.processing_blocks,
      addDrawDto.closing_blocks,
      addDrawDto.bet_amount,
    );

    return contractTx.toHex();
  }

  removeDraw(api: ApiPromise): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['removeDraw'](
      { gasLimit, storageDepositLimit: null }
    );

    return contractTx.toHex();
  }

  openDraw(api: ApiPromise, openDrawDto: OpenDrawDto): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['openDraw'](
      { gasLimit, storageDepositLimit: null },
      openDrawDto.draw_number,
    );

    return contractTx.toHex();
  }

  processDraw(api: ApiPromise, processDrawDto: ProcessDrawDto): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['processDraw'](
      { gasLimit, storageDepositLimit: null },
      processDrawDto.draw_number,
    );

    return contractTx.toHex();
  }

  overrideDraw(api: ApiPromise, overrideDrawDto: OverrideDrawDto): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['overrideDraw'](
      { gasLimit, storageDepositLimit: null },
      overrideDrawDto.draw_number,
      overrideDrawDto.winning_number,
    );

    return contractTx.toHex();
  }

  closeDraw(api: ApiPromise, closeDrawDto: CloseDrawDto): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['closeDraw'](
      { gasLimit, storageDepositLimit: null },
      closeDrawDto.draw_number,
    );

    return contractTx.toHex();
  }

  async getDraws(api: ApiPromise): Promise<string> {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractQuery = await contract.query['getDraws'](
      this.polkadotJsService.contractAddress,
      { gasLimit, storageDepositLimit: null },
    );

    return JSON.stringify(contractQuery.output?.toHuman());
  }

  async executeDraw(api: ApiPromise, executeDrawDto: ExecuteDrawDto): Promise<string> {
    this.polkadotJsService.validateConnection(api);

    return new Promise((resolve, reject) => {
      (async () => {
        const extrinsic = api.createType('Extrinsic', executeDrawDto.signed_hex);
        await api.tx(extrinsic).send(executeDrawResults => {
          if (executeDrawResults.isFinalized) {
            resolve(executeDrawResults.status.asFinalized.toHex().toString());
          }

          if (executeDrawResults.isError) {
            reject(new Error(executeDrawResults.status.toString()));
          }
        }).catch((error) => {
          reject(new Error(error));
        });
      })();
    });
  }

  addDrawJackpot(api: ApiPromise, addDrawJackpotDto: AddDrawJackpotDto): SubmittableExtrinsic<'promise', ISubmittableResult> {
    this.polkadotJsService.validateConnection(api);

    const contractAddress = this.polkadotJsService.contractAddress;
    const amount = addDrawJackpotDto.amount.toString();
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

  async executeDrawJackpot(api: ApiPromise, executeDrawJackpotDto: ExecuteDrawJackpotDto): Promise<string> {
    this.polkadotJsService.validateConnection(api);

    return new Promise((resolve, reject) => {
      (async () => {
        const extrinsic = api.createType('Extrinsic', executeDrawJackpotDto.signed_hex);
        await api.tx(extrinsic).send(async (sendAssetResults: ISubmittableResult) => {
          if (sendAssetResults.isFinalized) {
            const txHashHex = sendAssetResults.status.asFinalized.toHex();

            const keyring = new Keyring({ type: "sr25519" });
            const operatorsMnemonicSeeds = keyring.addFromMnemonic(this.OPERATORS_MNEMONIC_SEEDS);

            const contract = this.polkadotJsService.initContract(api);
            const gasLimit = this.polkadotJsService.createGasLimit(api);

            await contract.tx['addDrawJackpot']({ gasLimit, storageDepositLimit: null },
              executeDrawJackpotDto.draw_number,
              executeDrawJackpotDto.jackpot
            ).signAndSend(operatorsMnemonicSeeds, (addDrawJackpotResults: ISubmittableResult) => {
              if (addDrawJackpotResults.isInBlock) {
                resolve(addDrawJackpotResults.status.asInBlock.toHex().toString());
              }

              if (addDrawJackpotResults.isError) {
                reject(new Error(addDrawJackpotResults.status.toString()));
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
}