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
  Query,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto, UpdateClinicDto } from './dto';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  // Public endpoint - search clinics
  @Public()
  @Get()
  findAll(
    @Query('cityId') cityId?: string,
    @Query('specialtyId') specialtyId?: string,
  ) {
    return this.clinicsService.findAll({ cityId, specialtyId });
  }

  // Public endpoint - get clinic details
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicsService.findById(id);
  }
}

// Doctor-specific clinic management
@Controller('doctors/clinics')
@UseGuards(RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  findMyClinics(@CurrentUser() user: JwtUserPayload) {
    console.log(user);
    return this.clinicsService.findByDoctor(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() createDto: CreateClinicDto,
  ) {
    return this.clinicsService.create(user.id, createDto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicsService.findById(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(user.id, id, updateDto);
  }

  @Patch(':id/toggle-active')
  toggleActive(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicsService.toggleActive(user.id, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinicsService.delete(user.id, id);
  }
}
