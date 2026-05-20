import { IsArray, IsInt, IsNotEmpty, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestItemDto {
  @IsUUID()
  @IsNotEmpty()
  farmerId: string;

  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  notes?: string;
}

export class SubmitRequestsDto {
  @IsUUID()
  @IsNotEmpty()
  distributorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];
}
