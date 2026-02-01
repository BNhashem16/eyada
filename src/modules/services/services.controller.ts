import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

// Public endpoint for viewing clinic services
@ApiTags('Clinics - Services')
@Controller('clinics')
export class ServicesPublicController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get(':clinicId/services')
  getServices(@Param('clinicId', ParseUUIDPipe) clinicId: string) {
    return this.servicesService.findByClinic(clinicId);
  }
}

// Doctor management of services
@ApiTags('Doctors - Services')
@ApiBearerAuth('JWT-auth')
@Controller('doctors/clinics/:clinicId/services')
@UseGuards(RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(@Param('clinicId', ParseUUIDPipe) clinicId: string) {
    return this.servicesService.findByClinic(clinicId);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUserPayload,
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() createDto: CreateServiceTypeDto,
  ) {
    return this.servicesService.create(user.id, clinicId, createDto);
  }

  @Get(':serviceId')
  findOne(@Param('serviceId', ParseUUIDPipe) serviceId: string) {
    return this.servicesService.findById(serviceId);
  }

  @Patch(':serviceId')
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() updateDto: UpdateServiceTypeDto,
  ) {
    return this.servicesService.update(user.id, serviceId, updateDto);
  }

  @Patch(':serviceId/toggle-active')
  toggleActive(
    @CurrentUser() user: JwtUserPayload,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ) {
    return this.servicesService.toggleActive(user.id, serviceId);
  }

  @Delete(':serviceId')
  remove(
    @CurrentUser() user: JwtUserPayload,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ) {
    return this.servicesService.delete(user.id, serviceId);
  }
}
