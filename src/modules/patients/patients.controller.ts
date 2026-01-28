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
import { PatientsService } from './patients.service';
import {
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
  AddFamilyMemberDto,
} from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

@Controller('patients')
@UseGuards(RolesGuard)
@Roles(Role.PATIENT)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // Get own profile
  @Get('profile')
  getProfile(@CurrentUser() user: JwtUserPayload) {
    return this.patientsService.findByUserId(user.id);
  }

  // Create profile (if not exists)
  @Post('profile')
  createProfile(
    @CurrentUser() user: JwtUserPayload,
    @Body() createDto: CreatePatientProfileDto,
  ) {
    return this.patientsService.createProfile(user.id, createDto);
  }

  // Update profile
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: JwtUserPayload,
    @Body() updateDto: UpdatePatientProfileDto,
  ) {
    return this.patientsService.updateProfile(user.id, updateDto);
  }

  // Get medical data (encrypted)
  @Get('profile/medical')
  getMedicalData(@CurrentUser() user: JwtUserPayload) {
    return this.patientsService.getMedicalData(user.id);
  }

  // Update medical data (encrypted)
  @Patch('profile/medical')
  updateMedicalData(
    @CurrentUser() user: JwtUserPayload,
    @Body() data: { chronicDiseases?: string[]; allergies?: string[] },
  ) {
    return this.patientsService.updateMedicalData(user.id, data);
  }

  // Family Management
  @Get('family')
  getFamilyMembers(@CurrentUser() user: JwtUserPayload) {
    return this.patientsService.getFamilyMembers(user.id);
  }

  @Post('family')
  addFamilyMember(
    @CurrentUser() user: JwtUserPayload,
    @Body() addFamilyMemberDto: AddFamilyMemberDto,
  ) {
    return this.patientsService.addFamilyMember(user.id, addFamilyMemberDto);
  }

  @Delete('family/:id')
  removeFamilyMember(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) familyMemberId: string,
  ) {
    return this.patientsService.removeFamilyMember(user.id, familyMemberId);
  }
}
