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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto, UpdateClinicDto, ClinicSearchDto } from './dto';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  // Public endpoint - search clinics with full filtering
  @Public()
  @Get()
  findAll(@Query() searchDto: ClinicSearchDto) {
    return this.clinicsService.findAll(searchDto);
  }

  // Public endpoint - get clinic details
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicsService.findById(id);
  }
}

// Doctor-specific clinic management
@ApiTags('Doctors - Clinics')
@ApiBearerAuth('JWT-auth')
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
