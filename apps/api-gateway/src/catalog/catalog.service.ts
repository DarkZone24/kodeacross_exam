import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, ILike } from 'typeorm';
import { Farmer, Product } from '@agriconnect/shared-database';
import { FarmerFilterDto, ProductCursorDto } from './dto/pagination.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Farmer)
    private readonly farmerRepo: Repository<Farmer>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getPaginatedFarmers(query: FarmerFilterDto) {
    const { page = 1, limit = 20, region, name } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.farmerRepo.createQueryBuilder('farmer');

    if (region) {
      queryBuilder.andWhere('farmer.region = :region', { region });
    }

    if (name) {
      queryBuilder.andWhere('farmer.name ILIKE :name', { name: `%${name}%` });
    }

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaginatedProducts(farmerId: string, query: ProductCursorDto) {
    const { limit = 20, cursor } = query;

    const queryBuilder = this.productRepo.createQueryBuilder('product')
      .where('product.farmer_id = :farmerId', { farmerId })
      .orderBy('product.id', 'ASC')
      .take(limit);

    if (cursor) {
      // Cursor-based pagination uses where id > cursor for ASC ordering
      queryBuilder.andWhere('product.id > :cursor', { cursor });
    }

    const data = await queryBuilder.getMany();

    const nextCursor = data.length > 0 ? data[data.length - 1].id : null;

    return {
      data,
      meta: {
        nextCursor,
        limit,
      },
    };
  }
}
