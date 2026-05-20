import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [], // RedisModule is global, DataSource comes from global TypeOrm setup
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
