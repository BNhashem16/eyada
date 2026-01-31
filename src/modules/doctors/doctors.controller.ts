import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
  DoctorSearchDto,
} from './dto';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // Public - search doctors
  @Public()
  @Get()
  findAll(@Query() searchDto: DoctorSearchDto) {
    return this.doctorsService.findAll(searchDto);
  }

  // Doctor - get own profile (must be before :id route)
  @Get('profile/me')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  getMyProfile(@CurrentUser() user: JwtUserPayload) {
    return this.doctorsService.findByUserId(user.id);
  }

  // Doctor - create profile (during registration completion)
  @Post('profile')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  createProfile(
    @CurrentUser() user: JwtUserPayload,
    @Body() createDto: CreateDoctorProfileDto,
  ) {
    return this.doctorsService.createProfile(user.id, createDto);
  }

  // Doctor - update own profile
  @Patch('profile')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  updateProfile(
    @CurrentUser() user: JwtUserPayload,
    @Body() updateDto: UpdateDoctorProfileDto,
  ) {
    return this.doctorsService.updateProfile(user.id, updateDto);
  }

  // Public - get doctor by ID (must be last - catches all other patterns)
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorsService.findById(id);
  }
}

// Admin controller for doctor management
@Controller('admin/doctors')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminDoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('pending')
  getPendingDoctors() {
    return this.doctorsService.getPendingDoctors();
  }

  @Patch(':id/approve')
  approveDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.doctorsService.approveDoctor(id, user.id);
  }

  @Patch(':id/reject')
  rejectDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorsService.rejectDoctor(id);
  }

  @Patch(':id/suspend')
  suspendDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorsService.suspendDoctor(id);
  }
}
