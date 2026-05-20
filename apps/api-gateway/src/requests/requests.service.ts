import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Product, Request, RequestStatus } from '@agriconnect/shared-database';
import { SubmitRequestsDto } from './dto/submit-requests.dto';
import Redis from 'ioredis';

@Injectable()
export class RequestsService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async routeRequests(dto: SubmitRequestsDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const affectedFarmers = new Set<string>();

    try {
      // Sort items by product ID to prevent deadlocks when acquiring multiple locks
      const sortedItems = [...dto.items].sort((a, b) => 
        a.productId.localeCompare(b.productId)
      );

      for (const item of sortedItems) {
        // ROW-LEVEL LOCKING: SELECT ... FOR UPDATE
        const product = await queryRunner.manager
          .createQueryBuilder(Product, 'product')
          .setLock('pessimistic_write') // Equivalent to FOR UPDATE
          .where('product.id = :id', { id: item.productId })
          .getOne();

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }

        if (product.farmer_id !== item.farmerId) {
          throw new BadRequestException(`Product ${item.productId} does not belong to farmer ${item.farmerId}`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${item.productId}. Available: ${product.stock}`);
        }

        // Deduct stock
        product.stock -= item.quantity;
        await queryRunner.manager.save(product);

        // Create the request record
        const request = new Request();
        request.distributor_id = dto.distributorId;
        request.farmer_id = item.farmerId;
        request.product_id = item.productId;
        request.quantity = item.quantity;
        request.notes = item.notes;
        request.status = RequestStatus.PENDING;

        await queryRunner.manager.save(request);

        affectedFarmers.add(item.farmerId);
      }

      await queryRunner.commitTransaction();

      // Fire real-time notifications via Redis Pub/Sub after successful commit
      for (const farmerId of affectedFarmers) {
        await this.redisClient.publish(`farmer-notify:${farmerId}`, JSON.stringify({
          type: 'new-request',
          timestamp: new Date().toISOString(),
          message: 'You have new requests from a distributor.',
        }));
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
