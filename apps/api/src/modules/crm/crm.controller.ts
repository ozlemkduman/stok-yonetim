import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('crm')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  // Contacts
  @Get('contacts')
  async findAllContacts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
  ) {
    const result = await this.service.findAllContacts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      source,
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit, 10) : 20)),
      },
    };
  }

  @Get('contacts/stats')
  async getContactStats() {
    const stats = await this.service.getContactStats();
    return { success: true, data: stats };
  }

  @Get('contacts/:id')
  async findContactById(@Param('id') id: string) {
    const contact = await this.service.findContactById(id);
    return { success: true, data: contact };
  }

  @Get('contacts/:id/detail')
  async getContactDetail(@Param('id') id: string) {
    const detail = await this.service.getContactDetail(id);
    return { success: true, data: detail };
  }

  @Get('contacts/:id/activities')
  async findActivitiesByContactId(@Param('id') id: string) {
    const activities = await this.service.findActivitiesByContactId(id);
    return { success: true, data: activities };
  }

  @Post('contacts/:id/convert-to-customer')
  async convertToCustomer(@Param('id') id: string) {
    const result = await this.service.convertToCustomer(id);
    return { success: true, data: result };
  }

  @Post('contacts')
  async createContact(@Body() dto: CreateContactDto) {
    const contact = await this.service.createContact(dto);
    return { success: true, data: contact };
  }

  @Patch('contacts/:id')
  async updateContact(@Param('id') id: string, @Body() dto: Partial<CreateContactDto>) {
    const contact = await this.service.updateContact(id, dto);
    return { success: true, data: contact };
  }

  @Delete('contacts/:id')
  async deleteContact(@Param('id') id: string) {
    await this.service.deleteContact(id);
    return { success: true, message: 'Kisi silindi' };
  }

  // Activities
  @Get('activities')
  async findAllActivities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('contactId') contactId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAllActivities({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      contactId,
      type,
      status,
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit, 10) : 20)),
      },
    };
  }

  @Post('activities')
  async createActivity(@Body() dto: CreateActivityDto) {
    const activity = await this.service.createActivity(dto);
    return { success: true, data: activity };
  }

  @Patch('activities/:id')
  async updateActivity(@Param('id') id: string, @Body() dto: Partial<CreateActivityDto>) {
    const activity = await this.service.updateActivity(id, dto);
    return { success: true, data: activity };
  }

  @Post('activities/:id/complete')
  async completeActivity(@Param('id') id: string) {
    const activity = await this.service.completeActivity(id);
    return { success: true, data: activity };
  }

  @Delete('activities/:id')
  async deleteActivity(@Param('id') id: string) {
    await this.service.deleteActivity(id);
    return { success: true, message: 'Aktivite silindi' };
  }
}
