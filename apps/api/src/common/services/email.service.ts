import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      const smtpPort = Number(port) || 587;
      this.transporter = nodemailer.createTransport({
        host,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user, pass },
      });
    } else {
      // Development: use Ethereal (fake SMTP) for testing
      this.logger.warn('SMTP ayarlari bulunamadi. E-postalar konsola yazilacak.');
      this.transporter = null as any;
    }
  }

  private get fromAddress(): string {
    return this.configService.get<string>('SMTP_FROM') || 'StokSayaç <noreply@stoksayac.com>';
  }

  private get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(`[DEV E-POSTA] Kime: ${options.to}`);
      this.logger.log(`[DEV E-POSTA] Konu: ${options.subject}`);
      this.logger.log(`[DEV E-POSTA] Link icerigi asagida:`);
      // Extract link from HTML for easy dev access
      const linkMatch = options.html.match(/href="([^"]+)"/);
      if (linkMatch) {
        this.logger.log(`[DEV E-POSTA] Link: ${linkMatch[1]}`);
      }
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`E-posta gonderildi: ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`E-posta gonderilemedi: ${options.to}`, (error as Error).stack || error);
      return false;
    }
  }

  async sendInvitation(email: string, token: string, tenantName?: string): Promise<boolean> {
    const link = `${this.frontendUrl}/register?token=${token}`;
    const orgText = tenantName ? ` <strong>${tenantName}</strong> organizasyonuna` : '';

    return this.sendMail({
      to: email,
      subject: 'StokSayaç - Davet',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">StokSayaç</h1>
          </div>
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Davet Edildiniz!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Merhaba,<br><br>
              StokSayaç platformuna${orgText} katilmaniz icin davet edildiniz.
              Hesabinizi olusturmak icin asagidaki butona tiklayin.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Daveti Kabul Et
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px;">
              Bu davet 7 gun icinde gecerliliginizi yitirecektir.<br>
              Link calismiyorsa asagidaki adresi tarayiciniza yapisirin:<br>
              <a href="${link}" style="color: #4f46e5; word-break: break-all;">${link}</a>
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Bu e-postayi siz talep etmediyseniz, lutfen dikkate almayin.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const link = `${this.frontendUrl}/reset-password?token=${token}`;

    return this.sendMail({
      to: email,
      subject: 'StokSayaç - Sifre Sifirlama',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">StokSayaç</h1>
          </div>
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1a1a2e; margin-top: 0;">Sifre Sifirlama</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Merhaba,<br><br>
              Hesabiniz icin sifre sifirlama talebi alindi.
              Sifrenizi sifirlamak icin asagidaki butona tiklayin.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Sifremi Sifirla
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px;">
              Bu link 1 saat icinde gecerliliginizi yitirecektir.<br>
              Link calismiyorsa asagidaki adresi tarayiciniza yapisirin:<br>
              <a href="${link}" style="color: #4f46e5; word-break: break-all;">${link}</a>
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Bu e-postayi siz talep etmediyseniz, sifreniz degismeyecektir. Lutfen dikkate almayin.
          </p>
        </div>
      `,
    });
  }
}
