import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { SubmitRequestsDto } from './dto/submit-requests.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitRequests(@Body() dto: SubmitRequestsDto) {
    await this.requestsService.routeRequests(dto);
    return { success: true, message: 'Requests routed successfully' };
  }
}
