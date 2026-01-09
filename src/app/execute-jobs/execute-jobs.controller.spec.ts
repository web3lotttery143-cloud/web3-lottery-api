import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteJobsController } from './execute-jobs.controller';

describe('ExecuteJobsController', () => {
  let controller: ExecuteJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecuteJobsController],
    }).compile();

    controller = module.get<ExecuteJobsController>(ExecuteJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
