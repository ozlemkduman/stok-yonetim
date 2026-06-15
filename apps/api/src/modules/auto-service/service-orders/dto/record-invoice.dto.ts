import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min, MaxLength } from 'class-validator';

/** Harici portalda kesilen faturanın iş emrine kaydedilmesi + opsiyonel cari/kasa işleme. */
export const INVOICE_POSTINGS = ['none', 'veresiye', 'nakit', 'kredi_karti', 'havale'] as const;

export class RecordInvoiceDto {
  @IsString()
  @MaxLength(50)
  invoice_number: string;

  @IsOptional()
  @IsDateString()
  invoice_date?: string;

  @IsNumber()
  @Min(0)
  invoice_amount: number;

  @IsOptional()
  @IsString()
  invoice_file_url?: string;

  /**
   * Tutar cari/kasaya nasıl işlensin? Kullanıcı seçer.
   * none = sadece kayıt | veresiye = müşteri carisine borç |
   * nakit/kredi_karti/havale = kasa/banka gelir.
   */
  @IsOptional()
  @IsIn(INVOICE_POSTINGS as unknown as string[])
  posting?: string;
}
