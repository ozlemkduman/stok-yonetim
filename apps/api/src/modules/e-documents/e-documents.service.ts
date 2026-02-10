import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EDocumentsRepository, EDocument } from './e-documents.repository';
import { GibMockService } from './gib-mock.service';
import { CreateEDocumentDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { SalesRepository } from '../sales/sales.repository';

@Injectable()
export class EDocumentsService {
  constructor(
    private readonly repository: EDocumentsRepository,
    private readonly gibMock: GibMockService,
    private readonly salesRepository: SalesRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    documentType?: string;
    status?: string;
    referenceType?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.repository.findAll({
      page: params.page || 1,
      limit: params.limit || 20,
      documentType: params.documentType,
      status: params.status,
      referenceType: params.referenceType,
      customerId: params.customerId,
      startDate: params.startDate,
      endDate: params.endDate,
      sortBy: params.sortBy || 'created_at',
      sortOrder: params.sortOrder || 'desc',
    });
  }

  async findById(id: string) {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundException('e-Belge bulunamadi');
    }

    const logs = await this.repository.getLogs(id);
    return { ...document, logs };
  }

  async create(dto: CreateEDocumentDto): Promise<EDocument> {
    // Get reference data (sale or return)
    let referenceData: any = null;
    let items: any[] = [];

    if (dto.reference_type === 'sale') {
      referenceData = await this.salesRepository.findById(dto.reference_id);
      if (!referenceData) {
        throw new NotFoundException('Satis bulunamadi');
      }
      items = await this.salesRepository.findItemsBySaleId(dto.reference_id);
    }

    if (!referenceData) {
      throw new BadRequestException('Referans belge bulunamadi');
    }

    // Check if document already exists
    const existingDocs = await this.repository.findByReference(dto.reference_type, dto.reference_id);
    const existingOfType = existingDocs.find((d) => d.document_type === dto.document_type && d.status !== 'cancelled');
    if (existingOfType) {
      throw new BadRequestException(`Bu referans icin zaten bir ${dto.document_type} belgesi mevcut`);
    }

    return this.db.transaction(async (trx) => {
      const documentNumber = await this.repository.generateDocumentNumber(dto.document_type);

      // Generate mock XML
      const xmlContent = this.gibMock.generateEInvoiceXml({
        documentNumber,
        issueDate: new Date(),
        customerName: referenceData.customer_name || 'Genel Musteri',
        customerTaxNumber: referenceData.tax_number,
        items: items.map((item) => ({
          name: item.product_name || 'Urun',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          vatRate: item.vat_rate,
        })),
        totalAmount: referenceData.grand_total,
        vatAmount: referenceData.vat_total,
      });

      const document = await this.repository.create({
        document_type: dto.document_type,
        document_number: documentNumber,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id,
        customer_id: referenceData.customer_id,
        issue_date: new Date(),
        amount: referenceData.subtotal,
        vat_amount: referenceData.vat_total,
        total_amount: referenceData.grand_total,
        status: 'draft',
        xml_content: xmlContent,
      }, trx);

      await this.repository.createLog({
        document_id: document.id,
        action: 'created',
        status_after: 'draft',
        message: 'Belge olusturuldu',
      }, trx);

      return document;
    });
  }

  async send(id: string): Promise<EDocument> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundException('e-Belge bulunamadi');
    }

    if (document.status !== 'draft') {
      throw new BadRequestException('Sadece taslak belgeler gonderilebilir');
    }

    return this.db.transaction(async (trx) => {
      // Send to GIB (mock)
      const result = await this.gibMock.sendDocument(document.document_type, document.xml_content || '');

      const updateData: Partial<EDocument> = {
        status: result.success ? 'pending' : 'draft',
        gib_uuid: result.gibUuid || null,
        envelope_uuid: result.envelopeUuid || null,
        gib_response_code: result.responseCode,
        gib_response_message: result.responseMessage,
        sent_at: result.success ? new Date() : null,
      };

      const updated = await this.repository.update(id, updateData, trx);

      await this.repository.createLog({
        document_id: id,
        action: result.success ? 'sent' : 'send_failed',
        status_before: document.status,
        status_after: updated.status,
        message: result.responseMessage,
      }, trx);

      return updated;
    });
  }

  async checkStatus(id: string): Promise<EDocument> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundException('e-Belge bulunamadi');
    }

    if (!document.gib_uuid) {
      throw new BadRequestException('Belge henuz gonderilmemis');
    }

    if (['approved', 'rejected', 'cancelled'].includes(document.status)) {
      return document;
    }

    return this.db.transaction(async (trx) => {
      const result = await this.gibMock.checkStatus(document.gib_uuid!);

      const updateData: Partial<EDocument> = {
        status: result.status,
        gib_response_code: result.responseCode,
        gib_response_message: result.responseMessage,
        approved_at: result.status === 'approved' ? new Date() : null,
      };

      const updated = await this.repository.update(id, updateData, trx);

      await this.repository.createLog({
        document_id: id,
        action: 'status_checked',
        status_before: document.status,
        status_after: updated.status,
        message: result.responseMessage,
      }, trx);

      return updated;
    });
  }

  async cancel(id: string): Promise<EDocument> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new NotFoundException('e-Belge bulunamadi');
    }

    if (!['draft', 'pending'].includes(document.status)) {
      throw new BadRequestException('Sadece taslak veya bekleyen belgeler iptal edilebilir');
    }

    return this.db.transaction(async (trx) => {
      const updated = await this.repository.update(id, { status: 'cancelled' }, trx);

      await this.repository.createLog({
        document_id: id,
        action: 'cancelled',
        status_before: document.status,
        status_after: 'cancelled',
        message: 'Belge iptal edildi',
      }, trx);

      return updated;
    });
  }

  async getSummary() {
    return this.repository.getSummary();
  }
}
