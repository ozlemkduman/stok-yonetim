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
      const name = file.originalname.toLowerCase();
      if (!name.endsWith('.xml') && !name.endsWith('.csv')) {
        return cb(new BadRequestException('Sadece XML ve CSV dosyaları kabul edilir'), false);
      }
      cb(null, true);
    },
  }))
  async parse(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenmedi');
    }
    const fileType = file.originalname.toLowerCase().endsWith('.csv') ? 'csv' : 'xml';
    const preview = await this.invoiceImportService.parseAndPreview(file.buffer, fileType);
    return { success: true, data: preview };
  }

  @Post('confirm')
  async confirm(@Req() req: any) {
    const data = req.body as ConfirmImportData;
    if (!data?.customer || !data?.items || !data?.invoice) {
      throw new BadRequestException('Geçersiz import verisi');
    }
    const result = await this.invoiceImportService.confirmImport(data, req.user?.sub);
    return { success: true, data: result };
  }
}
