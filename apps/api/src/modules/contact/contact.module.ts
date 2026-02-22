import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { EmailService } from '../../common/services/email.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, EmailService],
})
export class ContactModule {}
