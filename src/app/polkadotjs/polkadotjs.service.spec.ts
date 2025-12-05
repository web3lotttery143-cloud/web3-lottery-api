import { Test, TestingModule } from '@nestjs/testing';
import { PolkadotjsService } from './polkadotjs.service';

describe('PolkadotjsService', () => {
  let service: PolkadotjsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolkadotjsService],
    }).compile();

    service = module.get<PolkadotjsService>(PolkadotjsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
