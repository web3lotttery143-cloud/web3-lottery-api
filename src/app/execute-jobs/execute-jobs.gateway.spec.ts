import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteJobsGateway } from './execute-jobs.gateway';

describe('ExecuteJobsGateway', () => {
  let gateway: ExecuteJobsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecuteJobsGateway],
    }).compile();

    gateway = module.get<ExecuteJobsGateway>(ExecuteJobsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
