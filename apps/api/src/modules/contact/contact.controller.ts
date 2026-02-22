import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ContactService } from './contact.service';
import { DemoApplicationDto } from './dto/demo-application.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post('demo')
  async submitDemo(@Body() dto: DemoApplicationDto) {
    await this.contactService.submitDemoApplication(dto);
    return { message: 'Basvuru alindi' };
  }
}
