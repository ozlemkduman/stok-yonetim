import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmRepository, CrmContact, CrmActivity } from './crm.repository';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class CrmService {
  constructor(private readonly repository: CrmRepository) {}

  // Contacts
  async findAllContacts(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    source?: string;
  }): Promise<{ items: CrmContact[]; total: number }> {
    return this.repository.findAllContacts({
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search,
      status: params.status,
      source: params.source,
    });
  }

  async findContactById(id: string): Promise<CrmContact> {
    const contact = await this.repository.findContactById(id);
    if (!contact) {
      throw new NotFoundException('Kisi bulunamadi');
    }
    return contact;
  }

  async createContact(dto: CreateContactDto): Promise<CrmContact> {
    const data: Partial<CrmContact> = {
      ...dto,
      next_follow_up: dto.next_follow_up ? new Date(dto.next_follow_up) : undefined,
    };
    return this.repository.createCrmContact(data);
  }

  async updateContact(id: string, dto: Partial<CreateContactDto>): Promise<CrmContact> {
    await this.findContactById(id);
    const data: Partial<CrmContact> = {
      ...dto,
      next_follow_up: dto.next_follow_up ? new Date(dto.next_follow_up) : undefined,
    };
    return this.repository.updateCrmContact(id, data);
  }

  async deleteContact(id: string): Promise<void> {
    await this.findContactById(id);
    await this.repository.deleteCrmContact(id);
  }

  // Activities
  async findActivitiesByContactId(contactId: string): Promise<CrmActivity[]> {
    await this.findContactById(contactId);
    return this.repository.findActivitiesByContactId(contactId);
  }

  async findAllActivities(params: {
    page?: number;
    limit?: number;
    contactId?: string;
    type?: string;
    status?: string;
  }): Promise<{ items: CrmActivity[]; total: number }> {
    return this.repository.findAllActivities({
      page: params.page || 1,
      limit: params.limit || 20,
      contactId: params.contactId,
      type: params.type,
      status: params.status,
    });
  }

  async createActivity(dto: CreateActivityDto): Promise<CrmActivity> {
    await this.findContactById(dto.contact_id);
    const data: Partial<CrmActivity> = {
      ...dto,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
    };
    return this.repository.createCrmActivity(data);
  }

  async updateActivity(id: string, dto: Partial<CreateActivityDto>): Promise<CrmActivity> {
    const data: Partial<CrmActivity> = {
      ...dto,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
    };
    return this.repository.updateCrmActivity(id, data);
  }

  async completeActivity(id: string): Promise<CrmActivity> {
    return this.repository.updateCrmActivity(id, {
      status: 'completed',
      completed_at: new Date(),
    });
  }

  async deleteActivity(id: string): Promise<void> {
    await this.repository.deleteCrmActivity(id);
  }

  // Stats
  async getContactStats() {
    return this.repository.getContactStats();
  }

  // Contact Detail (contact + activities + stats)
  async getContactDetail(id: string) {
    const contact = await this.findContactById(id);
    const activities = await this.repository.findActivitiesByContactId(id);
    const stats = await this.repository.getContactActivityStats(id);
    return { contact, activities, stats };
  }

  // Convert contact to customer
  async convertToCustomer(id: string): Promise<{ contact: CrmContact; customerId: string }> {
    const contact = await this.findContactById(id);

    if (contact.customer_id) {
      throw new NotFoundException('Bu kisi zaten bir musteriye baglidir');
    }

    const customerId = await this.repository.convertToCustomer(id, contact);
    const updatedContact = await this.repository.updateCrmContact(id, {
      customer_id: customerId,
      status: 'customer',
    });

    return { contact: updatedContact, customerId };
  }
}
