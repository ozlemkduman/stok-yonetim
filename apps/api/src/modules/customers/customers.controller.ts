import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';
import { parseCustomerFile, ParsedCustomerRow } from './customer-import.parser';
import { DatabaseService } from '../../database/database.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';

const ALLOWED_SORT_COLUMNS = ['name', 'balance', 'phone', 'email', 'created_at'];

export interface CustomerImportPreview {
  parsed: ParsedCustomerRow;
  isNew: boolean;
  matchedId: string | null;
  matchedName: string | null;
}

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly db: DatabaseService,
  ) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { isActive?: string; renewalStatus?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const validRenewalStatuses = ['red', 'yellow', 'green'];
    const params = {
      page,
      limit,
      search: query.search,
      sortBy: validateSortColumn(query.sortBy || 'created_at', ALLOWED_SORT_COLUMNS, 'created_at'),
      sortOrder: query.sortOrder || 'desc',
      isActive: query.isActive === 'false' ? false : true,
      renewalStatus: validRenewalStatuses.includes(query.renewalStatus as string)
        ? (query.renewalStatus as 'red' | 'yellow' | 'green')
        : undefined,
    };

    const result = await this.customersService.findAll(params);
    return {
      success: true,
      data: result.items,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Get('with-debt')
  async getCustomersWithDebt() {
    const data = await this.customersService.getCustomersWithDebt();
    return { success: true, data };
  }

  @Get('with-credit')
  async getCustomersWithCredit() {
    const data = await this.customersService.getCustomersWithCredit();
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.findById(id);
    return { success: true, data };
  }

  @Get(':id/detail')
  async getCustomerDetail(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerDetail(id);
    return { success: true, data };
  }

  @Get(':id/sales')
  async getCustomerSales(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerSales(id);
    return { success: true, data };
  }

  @Get(':id/returns')
  async getCustomerReturns(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerReturns(id);
    return { success: true, data };
  }

  @Get(':id/payments')
  async getCustomerPayments(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerPayments(id);
    return { success: true, data };
  }

  @Get(':id/stats')
  async getCustomerStats(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerStats(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto, @Req() req: any) {
    const data = await this.customersService.create(dto, req.user?.sub);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const data = await this.customersService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.customersService.delete(id);
    return { success: true, message: 'Musteri basariyla silindi' };
  }

  // --- Bulk Import ---

  @Post('import/parse')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const name = file.originalname.toLowerCase();
      if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
        return cb(new BadRequestException('Sadece CSV ve Excel dosyaları kabul edilir'), false);
      }
      cb(null, true);
    },
  }))
  async importParse(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Dosya yüklenmedi');
    }

    const name = file.originalname.toLowerCase();
    const fileType = name.endsWith('.csv') ? 'csv' as const : 'xlsx' as const;

    let customers: ParsedCustomerRow[];
    try {
      customers = parseCustomerFile(file.buffer, fileType);
    } catch (err) {
      throw new BadRequestException(
        'Dosya parse edilemedi: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'),
      );
    }

    // Match by tax_number or name
    const tenantId = getCurrentTenantId();
    const previews: CustomerImportPreview[] = await Promise.all(
      customers.map(async (c) => {
        let existing: any = null;

        // First try tax number match
        if (c.taxNumber) {
          existing = await this.db.knex('customers')
            .where('tax_number', c.taxNumber)
            .modify((qb) => { if (tenantId) qb.where('tenant_id', tenantId); })
            .first();
        }

        // Then try exact name match
        if (!existing) {
          existing = await this.db.knex('customers')
            .whereRaw('LOWER(name) = LOWER(?)', [c.name])
            .modify((qb) => { if (tenantId) qb.where('tenant_id', tenantId); })
            .first();
        }

        return {
          parsed: c,
          isNew: !existing,
          matchedId: existing?.id || null,
          matchedName: existing?.name || null,
        };
      }),
    );

    const newCount = previews.filter((p) => p.isNew).length;
    const existingCount = previews.filter((p) => !p.isNew).length;

    return {
      success: true,
      data: {
        customers: previews,
        summary: { total: previews.length, newCount, existingCount },
      },
    };
  }

  @Post('import/confirm')
  async importConfirm(@Body() body: { customers: CustomerImportPreview[]; skipExisting?: boolean }, @Req() req: any) {
    if (!body?.customers || body.customers.length === 0) {
      throw new BadRequestException('Geçersiz import verisi');
    }

    const tenantId = getCurrentTenantId();
    const skipExisting = body.skipExisting !== false; // default: skip existing

    let created = 0;
    let skipped = 0;
    let updated = 0;

    await this.db.transaction(async (trx) => {
      for (const item of body.customers) {
        if (!item.isNew && skipExisting) {
          skipped++;
          continue;
        }

        if (item.isNew) {
          // Create new customer
          const insertData: Record<string, unknown> = {
            name: item.parsed.name,
            phone: item.parsed.phone,
            email: item.parsed.email,
            address: item.parsed.address,
            tax_number: item.parsed.taxNumber,
            tax_office: item.parsed.taxOffice,
            notes: item.parsed.notes,
          };
          if (tenantId) insertData.tenant_id = tenantId;

          await trx('customers').insert(insertData);
          created++;
        } else {
          // Update existing customer with non-empty fields
          const updateData: Record<string, unknown> = {};
          if (item.parsed.phone) updateData.phone = item.parsed.phone;
          if (item.parsed.email) updateData.email = item.parsed.email;
          if (item.parsed.address) updateData.address = item.parsed.address;
          if (item.parsed.taxNumber) updateData.tax_number = item.parsed.taxNumber;
          if (item.parsed.taxOffice) updateData.tax_office = item.parsed.taxOffice;
          if (item.parsed.notes) updateData.notes = item.parsed.notes;

          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = trx.fn.now();
            await trx('customers').where('id', item.matchedId).update(updateData);
            updated++;
          } else {
            skipped++;
          }
        }
      }
    });

    return {
      success: true,
      data: { created, updated, skipped },
    };
  }
}
