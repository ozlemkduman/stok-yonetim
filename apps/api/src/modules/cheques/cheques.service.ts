import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { ChequesRepository, Cheque } from './cheques.repository';
import { CreateChequeDto, UpdateChequeStatusDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';

/**
 * Çek/Senet status değişiminde kasa/banka hareketi:
 * - direction=incoming + status=collected → hesaba gelir
 * - direction=outgoing + status=cashed_out → hesaptan gider
 * - Diğer status'ler sadece bilgi amaçlı, hesap etkilemez
 */
async function recordChequeAccountMovement(
  trx: Knex.Transaction,
  cheque: Cheque,
  accountId: string,
  isIncome: boolean,
): Promise<void> {
  const account = await trx('accounts').where('id', accountId).first();
  if (!account) throw new BadRequestException('Hesap bulunamadı');

  const amount = Number(cheque.amount);
  const signedDelta = isIncome ? amount : -amount;
  const newBalance = (Number(account.current_balance) || 0) + signedDelta;

  await trx('account_movements').insert({
    tenant_id: cheque.tenant_id,
    account_id: accountId,
    movement_type: isIncome ? 'gelir' : 'gider',
    amount,
    balance_after: newBalance,
    category: isIncome ? 'çek/senet tahsilatı' : 'çek/senet ödemesi',
    description: `${cheque.type === 'cek' ? 'Çek' : 'Senet'} (${cheque.cheque_number || '—'})`,
    reference_type: 'cheque',
    reference_id: cheque.id,
    movement_date: new Date(),
  });

  await trx('accounts').where('id', accountId).update({
    current_balance: newBalance,
    updated_at: trx.fn.now(),
  });
}

@Injectable()
export class ChequesService {
  constructor(
    private readonly repository: ChequesRepository,
    private readonly db: DatabaseService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.repository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Cheque> {
    const cheque = await this.repository.findById(id);
    if (!cheque) throw new NotFoundException('Çek/Senet bulunamadı');
    return cheque;
  }

  async create(dto: CreateChequeDto, userId?: string): Promise<Cheque> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new BadRequestException('Tenant context bulunamadı');

    // Karşı taraf kontrolü
    if (!dto.customer_id && !dto.supplier_id) {
      throw new BadRequestException('Müşteri veya tedarikçi seçilmelidir');
    }
    if (dto.customer_id && dto.supplier_id) {
      throw new BadRequestException('Aynı kayıtta hem müşteri hem tedarikçi seçilemez');
    }

    const insertData = {
      tenant_id: tenantId,
      type: dto.type,
      direction: dto.direction,
      cheque_number: dto.cheque_number || null,
      bank_name: dto.bank_name || null,
      drawer_name: dto.drawer_name || null,
      customer_id: dto.customer_id || null,
      supplier_id: dto.supplier_id || null,
      amount: dto.amount,
      issue_date: dto.issue_date ? new Date(dto.issue_date) : null,
      due_date: new Date(dto.due_date),
      status: 'in_portfolio',
      notes: dto.notes || null,
      created_by: userId || null,
    };

    const [cheque] = await this.db.knex('cheques').insert(insertData).returning('*');

    await this.activityLog.log({
      action: 'cheque_created',
      entityType: 'cheque',
      entityId: cheque.id,
      newValues: { type: dto.type, direction: dto.direction, amount: dto.amount, due_date: dto.due_date },
    });

    return cheque;
  }

  async updateStatus(id: string, dto: UpdateChequeStatusDto): Promise<Cheque> {
    const cheque = await this.repository.findById(id);
    if (!cheque) throw new NotFoundException('Çek/Senet bulunamadı');

    const requiresAccount = dto.status === 'collected' || dto.status === 'cashed_out';
    if (requiresAccount && !dto.account_id) {
      throw new BadRequestException('Bu durum için hesap (kasa/banka) seçilmelidir');
    }

    if (dto.status === 'collected' && cheque.direction !== 'incoming') {
      throw new BadRequestException('Sadece alınan çek/senet tahsil edilebilir');
    }
    if (dto.status === 'cashed_out' && cheque.direction !== 'outgoing') {
      throw new BadRequestException('Sadece verilen çek/senet ödenmiş olarak işaretlenebilir');
    }

    return this.db.transaction(async (trx) => {
      // Eğer önceki status zaten hesap etkilemişse geri al (tutarlılık)
      if (cheque.status === 'collected' || cheque.status === 'cashed_out') {
        if (cheque.account_id) {
          const wasIncome = cheque.status === 'collected';
          await recordChequeAccountMovement(trx, cheque, cheque.account_id, !wasIncome); // ters yön
        }
      }

      // Yeni status hesap etkiliyorsa uygula
      if (requiresAccount && dto.account_id) {
        const isIncome = dto.status === 'collected';
        await recordChequeAccountMovement(trx, cheque, dto.account_id, isIncome);
      }

      const [updated] = await trx('cheques').where('id', id).update({
        status: dto.status,
        account_id: requiresAccount ? dto.account_id : null,
        status_changed_at: new Date(),
        notes: dto.notes !== undefined ? dto.notes : cheque.notes,
        updated_at: trx.fn.now(),
      }).returning('*');

      await this.activityLog.log({
        action: 'cheque_status_changed',
        entityType: 'cheque',
        entityId: id,
        oldValues: { status: cheque.status },
        newValues: { status: dto.status, account_id: dto.account_id },
      });

      return updated;
    });
  }

  async delete(id: string): Promise<void> {
    const cheque = await this.repository.findById(id);
    if (!cheque) throw new NotFoundException('Çek/Senet bulunamadı');
    if (cheque.status === 'collected' || cheque.status === 'cashed_out') {
      throw new BadRequestException(
        'Hesaba yansımış çek/senet silinemez. Önce durumunu geri çekin (portföye al).',
      );
    }
    await this.db.knex('cheques').where('id', id).delete();
    await this.activityLog.log({
      action: 'cheque_deleted',
      entityType: 'cheque',
      entityId: id,
      oldValues: { type: cheque.type, amount: cheque.amount },
    });
  }

  async getStats() {
    const knex = this.db.knex;
    const tenantId = getCurrentTenantId();
    let q = knex('cheques');
    if (tenantId) q = q.where('tenant_id', tenantId);

    const [result] = await q.select(
      knex.raw("COUNT(*) FILTER (WHERE direction='incoming' AND status='in_portfolio') as incoming_portfolio_count"),
      knex.raw("COALESCE(SUM(amount) FILTER (WHERE direction='incoming' AND status='in_portfolio'), 0) as incoming_portfolio_total"),
      knex.raw("COUNT(*) FILTER (WHERE direction='outgoing' AND status='in_portfolio') as outgoing_portfolio_count"),
      knex.raw("COALESCE(SUM(amount) FILTER (WHERE direction='outgoing' AND status='in_portfolio'), 0) as outgoing_portfolio_total"),
      knex.raw("COUNT(*) FILTER (WHERE status='bounced') as bounced_count"),
      knex.raw("COUNT(*) FILTER (WHERE status='in_portfolio' AND due_date < CURRENT_DATE) as overdue_count"),
    );
    return {
      incomingPortfolio: { count: parseInt((result as any).incoming_portfolio_count || '0', 10), total: parseFloat((result as any).incoming_portfolio_total || '0') },
      outgoingPortfolio: { count: parseInt((result as any).outgoing_portfolio_count || '0', 10), total: parseFloat((result as any).outgoing_portfolio_total || '0') },
      bouncedCount: parseInt((result as any).bounced_count || '0', 10),
      overdueCount: parseInt((result as any).overdue_count || '0', 10),
    };
  }
}
