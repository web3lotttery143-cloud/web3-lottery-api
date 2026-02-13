import { Injectable, Logger, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

import metadata from './../../../contract/lottery.json';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { WeightV2 } from '@polkadot/types/interfaces';

@Injectable()
export class PolkadotjsService {
  private readonly logger = new Logger(PolkadotjsService.name);

  contractAddress = process.env.CONTRACT_ADDRESS || '';

  async connect(): Promise<ApiPromise> {
    try {
      await cryptoWaitReady();

      const wsUrls = process.env.WS_PROVIDERS;
      if (!wsUrls) {
        throw new InternalServerErrorException('WS_PROVIDERS environment variable is not set');
      }

      const providers = wsUrls.split(',').map(url => url.trim()).filter(Boolean);
      this.logger.log(`Connecting to providers: ${providers.join(', ')}`);

      const wsProvider = new WsProvider(providers, 30_000);
      const api = await ApiPromise.create({ provider: wsProvider });
      await api.isReady;

      return api;
    } catch (error) {
      this.logger.error('Failed to connect to Polkadot RPC endpoint:', error.message);
      throw new ServiceUnavailableException(
        `Unable to connect to Polkadot RPC endpoint: ${error.message}`
      );
    }
  }

  initContract(api: ApiPromise): ContractPromise {
    return new ContractPromise(api, metadata, this.contractAddress);
  }

  createGasLimit(api: ApiPromise): WeightV2 {
    return api.registry.createType<WeightV2>('WeightV2', {
      refTime: 10000000000n,
      proofSize: 1000000n
    });
  }

  validateConnection(api: ApiPromise): void {
    if (!api.isConnected) {
      throw new ServiceUnavailableException('Polkadot API is not connected');
    }
  }
}