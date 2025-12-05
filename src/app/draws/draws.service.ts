import { Injectable } from '@nestjs/common';

import { ApiPromise } from '@polkadot/api';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';
import { AddDrawDto } from './dto/add-draw.dto';
import { OpenDrawDto } from './dto/open-draw.dto';
import { ProcessDrawDto } from './dto/process-draw.dto';
import { OverrideDrawDto } from './dto/override-draw.dto';
import { CloseDrawDto } from './dto/close-draw.dto';

@Injectable()
export class DrawsService {

  constructor(
    private readonly polkadotJsService: PolkadotjsService
  ) { }

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
}
