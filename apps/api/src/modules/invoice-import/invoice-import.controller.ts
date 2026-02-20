import {
  Controller,
  Post,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoiceImportService, ConfirmImportData } from './invoice-import.service';

@Controller('invoice-import')
export class InvoiceImportController {
  constructor(private readonly invoiceImportService: InvoiceImportService) {}

  @Post('parse')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      if (!file.originalname.toLowerCase().endsWith('.xml')) {
        return cb(new BadRequestException('Sadece XML dosyaları kabul edilir'), false);
      }
      cb(null, true);
    },
  }))
  async parse(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenmedi');
    }
    const preview = await this.invoiceImportService.parseAndPreview(file.buffer);
    return { success: true, data: preview };
  }

  @Post('confirm')
  async confirm(@Req() req: any) {
    const fs = require('fs');
    try {
      const data = req.body as ConfirmImportData;
      fs.writeFileSync('/tmp/invoice-import-debug.log', `${new Date().toISOString()}\nBody type: ${typeof req.body}\nBody keys: ${JSON.stringify(Object.keys(req.body || {}))}\nHas customer: ${!!data?.customer}\nHas items: ${!!data?.items}\nHas invoice: ${!!data?.invoice}\n`);
      if (!data?.customer || !data?.items || !data?.invoice) {
        throw new BadRequestException('Geçersiz import verisi');
      }
      const result = await this.invoiceImportService.confirmImport(data, req.user?.sub);
      return { success: true, data: result };
    } catch (err: any) {
      fs.writeFileSync('/tmp/invoice-import-error.log', `${new Date().toISOString()}\n${err?.stack || err?.message || JSON.stringify(err)}\n`);
      throw err;
    }
  }
}
