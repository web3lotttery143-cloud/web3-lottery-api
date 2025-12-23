import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { PolkadotjsService } from '../polkadotjs/polkadotjs.service';

@WebSocketGateway({
  namespace: '/lottery-jobs',
  transports: ['polling', 'websocket'],
  cors: {
    origin: '*',
  },
})
export class ExecuteJobsGateway {

  constructor(
    private readonly polkadotJsService: PolkadotjsService,
  ) { }

  @WebSocketServer()
  server: Server;

  CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

  @SubscribeMessage('lottery-jobs')
  async handleLotteryJobs(
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    try {
      const api = await this.polkadotJsService.connect();
      this.polkadotJsService.validateConnection(api);

      const contract = this.polkadotJsService.initContract(api);
      const gasLimit = this.polkadotJsService.createGasLimit(api);

      await api.rpc.chain.subscribeNewHeads(async (header) => {
        const currentBlock = header.number.toNumber();

        const getLotterySetup = await contract.query['getLotterySetup'](
          this.CONTRACT_ADDRESS, { gasLimit, storageDepositLimit: null }
        );
        if (getLotterySetup.output) {
          const lottery = getLotterySetup.output.toJSON() as any;
          socket.emit('lottery', {
            block: currentBlock,
            contract: this.CONTRACT_ADDRESS,
            isStarted: lottery.ok?.isStarted,
            status: lottery.ok?.isStarted ? 'Started' : 'Stopped',
            startingBlock: lottery.ok?.startingBlock,
            nextStartingBlock: lottery.ok?.nextStartingBlock,
            operator: lottery.ok?.operator,
            dev: lottery.ok?.dev,
          });

          const startingBlock = Number(lottery.ok?.startingBlock.toString().replace(/,/g, ''));
          const getDraws = await contract.query['getDraws'](
            this.CONTRACT_ADDRESS, { gasLimit, storageDepositLimit: null }
          );
          if (getDraws.output) {
            const draws = getDraws.output.toJSON() as any;
            draws.ok?.map(d => {
              const openingBlocks = Number(d.openingBlocks.toString().replace(/,/g, '')) + startingBlock;
              const processingBlocks = Number(d.processingBlocks.toString().replace(/,/g, '')) + startingBlock;
              const closingBlocks = Number(d.closingBlocks.toString().replace(/,/g, '')) + startingBlock;

              const jackpot = Number(d.jackpot.toString().replace(/,/g, '')) / 1000000;

              socket.emit('draw', {
                block: currentBlock,
                drawNumber: d.drawNumber,
                status: d.status,
                isOpen: d.isOpen,
                openingBlocks,
                processingBlocks,
                closingBlocks,
                pot: jackpot + ' USDT',
                bets: d.bets.length,
                winningNumber: d.winningNumber,
                winners: d.winners.length,
              });
            });
          }
        }
      });
    } catch (error) {
      socket.emit('error', 'An Error Occurred: ' + error.message);
      return;
    }
  }
}