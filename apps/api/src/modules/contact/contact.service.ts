import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../common/services/email.service';
import { ConfigService } from '@nestjs/config';
import { DemoApplicationDto } from './dto/demo-application.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async submitDemoApplication(dto: DemoApplicationDto): Promise<boolean> {
    const recipient = this.configService.get<string>('DEMO_NOTIFY_EMAIL') || 'test@stoksayac.com';

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">StokSayaç</h1>
        </div>
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Yeni Demo Basvurusu</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; width: 140px;">Ad Soyad:</td>
              <td style="padding: 8px 12px; color: #4b5563;">${dto.name}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 8px 12px; font-weight: 600; color: #374151;">Telefon:</td>
              <td style="padding: 8px 12px; color: #4b5563;">${dto.phone}</td>
            </tr>
            ${dto.company ? `
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #374151;">Firma:</td>
              <td style="padding: 8px 12px; color: #4b5563;">${dto.company}</td>
            </tr>` : ''}
            ${dto.sector ? `
            <tr style="background: #f9fafb;">
              <td style="padding: 8px 12px; font-weight: 600; color: #374151;">Sektor:</td>
              <td style="padding: 8px 12px; color: #4b5563;">${dto.sector}</td>
            </tr>` : ''}
            ${dto.note ? `
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; color: #374151; vertical-align: top;">Not:</td>
              <td style="padding: 8px 12px; color: #4b5563;">${dto.note}</td>
            </tr>` : ''}
          </table>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Bu e-posta StokSayaç demo basvuru formundan otomatik olarak gonderilmistir.
        </p>
      </div>
    `;

    const sent = await this.emailService.sendMail({
      to: recipient,
      subject: `StokSayaç Demo Basvurusu - ${dto.name}`,
      html,
    });

    if (sent) {
      this.logger.log(`Demo basvurusu alindi: ${dto.name} (${dto.phone})`);
    }

    return sent;
  }
}
