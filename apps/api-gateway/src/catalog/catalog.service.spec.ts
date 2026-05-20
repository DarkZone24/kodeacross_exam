import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Farmer, Product } from '@agriconnect/shared-database';

describe('CatalogService', () => {
  let service: CatalogService;
  
  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
  };

  const mockFarmerRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockProductRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: getRepositoryToken(Farmer),
          useValue: mockFarmerRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPaginatedFarmers', () => {
    it('should return paginated farmers and total count', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: '1', name: 'Farmer 1' }], 1]);
      
      const result = await service.getPaginatedFarmers({ page: 1, limit: 10 });
      
      expect(result).toEqual({
        data: [{ id: '1', name: 'Farmer 1' }],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(mockFarmerRepo.createQueryBuilder).toHaveBeenCalledWith('farmer');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('getPaginatedProducts', () => {
    it('should return products using cursor pagination', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([{ id: '100', name: 'Product 1' }]);
      
      const result = await service.getPaginatedProducts('farmer-id', { limit: 10, cursor: '50' });
      
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.id > :cursor', { cursor: '50' });
      expect(result).toEqual({
        data: [{ id: '100', name: 'Product 1' }],
        meta: {
          nextCursor: '100',
          limit: 10,
        },
      });
    });
  });
});
