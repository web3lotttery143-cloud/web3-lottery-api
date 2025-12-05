import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteJobsService } from './execute-jobs.service';

describe('ExecuteJobsService', () => {
  let service: ExecuteJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecuteJobsService],
    }).compile();

    service = module.get<ExecuteJobsService>(ExecuteJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
