import { Controller, Get, Query, Param, UseInterceptors } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { FarmerFilterDto, ProductCursorDto } from './dto/pagination.dto';
import { CdnInterceptor } from '../interceptors/cdn.interceptor';

@Controller('catalog')
@UseInterceptors(CdnInterceptor)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('farmers')
  getFarmers(@Query() query: FarmerFilterDto) {
    return this.catalogService.getPaginatedFarmers(query);
  }

  @Get('farmers/:farmerId/products')
  getProducts(
    @Param('farmerId') farmerId: string,
    @Query() query: ProductCursorDto,
  ) {
    return this.catalogService.getPaginatedProducts(farmerId, query);
  }
}
