import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles, UserRole } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { InvitationsService, CreateInvitationDto } from '../services/invitations.service';

@Controller('admin/invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  async getInvitations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'pending' | 'accepted' | 'expired',
  ) {
    const result = await this.invitationsService.getInvitations({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
    });

    // Her davete link ekle
    const dataWithLinks = result.data.map((inv) => ({
      ...inv,
      invitationLink: this.invitationsService.getInvitationLink(inv.token),
    }));

    return {
      success: true,
      data: dataWithLinks,
      meta: result.meta,
    };
  }

  @Post()
  async createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: { sub: string },
  ) {
    const invitation = await this.invitationsService.createInvitation(dto, user.sub);
    const invitationLink = this.invitationsService.getInvitationLink(invitation.token);

    return {
      success: true,
      data: {
        ...invitation,
        invitationLink,
      },
    };
  }

  @Post(':id/resend')
  async resendInvitation(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
  ) {
    const invitation = await this.invitationsService.resendInvitation(id, user.sub);
    const invitationLink = this.invitationsService.getInvitationLink(invitation.token);

    return {
      success: true,
      data: {
        ...invitation,
        invitationLink,
      },
    };
  }

  @Delete(':id')
  async cancelInvitation(@Param('id') id: string) {
    await this.invitationsService.cancelInvitation(id);

    return {
      success: true,
      message: 'Davet iptal edildi',
    };
  }
}
