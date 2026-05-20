import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { DataSource } from 'typeorm';

describe('RequestsService', () => {
  let service: RequestsService;
  
  const mockQueryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockManager = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    save: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockRedisClient = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    jest.clearAllMocks();
  });

  it('should acquire lock, validate stock and create requests successfully', async () => {
    mockQueryBuilder.getOne.mockResolvedValue({ id: 'prod1', farmer_id: 'farmer1', stock: 10 });
    
    await service.routeRequests({
      distributorId: 'dist1',
      items: [
        { farmerId: 'farmer1', productId: 'prod1', quantity: 2 }
      ],
    });

    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(mockManager.save).toHaveBeenCalledTimes(2); // one for product stock, one for request
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockRedisClient.publish).toHaveBeenCalledWith(
      'farmer-notify:farmer1',
      expect.any(String)
    );
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback transaction if stock is insufficient', async () => {
    mockQueryBuilder.getOne.mockResolvedValue({ id: 'prod1', farmer_id: 'farmer1', stock: 1 });
    
    await expect(service.routeRequests({
      distributorId: 'dist1',
      items: [
        { farmerId: 'farmer1', productId: 'prod1', quantity: 2 }
      ],
    })).rejects.toThrow('Insufficient stock');

    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
    expect(mockRedisClient.publish).not.toHaveBeenCalled();
  });
});
