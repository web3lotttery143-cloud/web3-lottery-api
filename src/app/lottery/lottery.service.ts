import { Injectable } from '@nestjs/common';

import { ApiPromise } from '@polkadot/api';

import { PolkadotjsService } from './../polkadotjs/polkadotjs.service';
import { SetupDto } from './dto/setup.dto';

@Injectable()
export class LotteryService {

  constructor(
    private readonly polkadotJsService: PolkadotjsService
  ) { }

  setup(api: ApiPromise, setupDto: SetupDto): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['setup'](
      { gasLimit, storageDepositLimit: null },
      setupDto.operator,
      setupDto.asset_id,
      setupDto.starting_block,
      setupDto.daily_total_blocks,
      setupDto.maximum_draws,
      setupDto.maximum_bets,
    );

    return contractTx.toHex();
  }

  start(api: ApiPromise): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['start'](
      { gasLimit, storageDepositLimit: null },
    );

    return contractTx.toHex();
  }

  stop(api: ApiPromise): string {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractTx = contract.tx['stop'](
      { gasLimit, storageDepositLimit: null },
    );

    return contractTx.toHex();
  }

  async getLotterySetup(api: ApiPromise): Promise<string> {
    this.polkadotJsService.validateConnection(api);
    const contract = this.polkadotJsService.initContract(api);
    const gasLimit = this.polkadotJsService.createGasLimit(api);

    const contractQuery = await contract.query['getLotterySetup'](
      this.polkadotJsService.contractAddress,
      { gasLimit, storageDepositLimit: null },
    );

    return JSON.stringify(contractQuery.output?.toHuman());
  }
}
