import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsRepository, Account, AccountMovement, AccountTransfer } from './accounts.repository';
import { CreateAccountDto, UpdateAccountDto, CreateMovementDto, CreateTransferDto } from './dto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly repository: AccountsRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    accountType?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';
    const isActive = params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined;

    return this.repository.findAll({
      page,
      limit,
      accountType: params.accountType,
      isActive,
      sortBy,
      sortOrder,
    });
  }

  async findById(id: string): Promise<Account> {
    const account = await this.repository.findById(id);
    if (!account) {
      throw new NotFoundException('Hesap bulunamadi');
    }
    return account;
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    // If this is set as default, handle it
    if (dto.is_default) {
      await this.db.knex('accounts')
        .where('account_type', dto.account_type)
        .update({ is_default: false });
    }

    return this.repository.create({
      name: dto.name,
      account_type: dto.account_type,
      bank_name: dto.bank_name,
      iban: dto.iban,
      account_number: dto.account_number,
      branch_name: dto.branch_name,
      currency: dto.currency || 'TRY',
      opening_balance: dto.opening_balance || 0,
      is_default: dto.is_default || false,
    });
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findById(id);

    if (dto.is_default === true) {
      await this.repository.setDefault(id, account.account_type);
    }

    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  // Movements
  async getMovements(accountId: string, params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    movementType?: string;
  }) {
    await this.findById(accountId);

    return this.repository.findMovements({
      accountId,
      page: params.page || 1,
      limit: params.limit || 20,
      startDate: params.startDate,
      endDate: params.endDate,
      movementType: params.movementType,
    });
  }

  async addMovement(accountId: string, dto: CreateMovementDto): Promise<AccountMovement> {
    const account = await this.findById(accountId);

    if (!account.is_active) {
      throw new BadRequestException('Pasif hesaba hareket eklenemez');
    }

    return this.db.transaction(async (trx) => {
      // Calculate new balance
      const amountChange = dto.movement_type === 'gelir' ? dto.amount : -dto.amount;
      const newBalance = Number(account.current_balance) + amountChange;

      // Create movement
      const movement = await this.repository.createMovement({
        account_id: accountId,
        movement_type: dto.movement_type,
        amount: dto.amount,
        balance_after: newBalance,
        category: dto.category,
        description: dto.description,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id,
        movement_date: dto.movement_date ? new Date(dto.movement_date) : new Date(),
      }, trx);

      // Update account balance
      await this.repository.updateBalance(accountId, amountChange, trx);

      return movement;
    });
  }

  // Transfers
  async getTransfers(params: {
    page?: number;
    limit?: number;
    accountId?: string;
  }) {
    return this.repository.findTransfers({
      page: params.page || 1,
      limit: params.limit || 20,
      accountId: params.accountId,
    });
  }

  async createTransfer(dto: CreateTransferDto): Promise<AccountTransfer> {
    if (dto.from_account_id === dto.to_account_id) {
      throw new BadRequestException('Ayni hesaplar arasinda transfer yapilamaz');
    }

    const fromAccount = await this.findById(dto.from_account_id);
    const toAccount = await this.findById(dto.to_account_id);

    if (!fromAccount.is_active || !toAccount.is_active) {
      throw new BadRequestException('Pasif hesaplar arasinda transfer yapilamaz');
    }

    if (Number(fromAccount.current_balance) < dto.amount) {
      throw new BadRequestException('Yetersiz bakiye');
    }

    return this.db.transaction(async (trx) => {
      const transferDate = dto.transfer_date ? new Date(dto.transfer_date) : new Date();

      // Create transfer record
      const transfer = await this.repository.createTransfer({
        from_account_id: dto.from_account_id,
        to_account_id: dto.to_account_id,
        amount: dto.amount,
        description: dto.description,
        transfer_date: transferDate,
      }, trx);

      // Create movement for source account
      const fromNewBalance = Number(fromAccount.current_balance) - dto.amount;
      await this.repository.createMovement({
        account_id: dto.from_account_id,
        movement_type: 'transfer_out',
        amount: dto.amount,
        balance_after: fromNewBalance,
        description: `${toAccount.name} hesabina transfer`,
        reference_type: 'transfer',
        reference_id: transfer.id,
        movement_date: transferDate,
      }, trx);

      // Create movement for destination account
      const toNewBalance = Number(toAccount.current_balance) + dto.amount;
      await this.repository.createMovement({
        account_id: dto.to_account_id,
        movement_type: 'transfer_in',
        amount: dto.amount,
        balance_after: toNewBalance,
        description: `${fromAccount.name} hesabindan transfer`,
        reference_type: 'transfer',
        reference_id: transfer.id,
        movement_date: transferDate,
      }, trx);

      // Update balances
      await this.repository.updateBalance(dto.from_account_id, -dto.amount, trx);
      await this.repository.updateBalance(dto.to_account_id, dto.amount, trx);

      return transfer;
    });
  }

  // Summary
  async getSummary() {
    return this.repository.getSummary();
  }
}
