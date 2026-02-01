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
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  CreateSecretaryAppointmentDto,
  UpdateAppointmentStatusDto,
  UpdateMedicalNotesDto,
  UpdatePaymentStatusDto,
  PatientAppointmentFilterDto,
  AppointmentFilterDto,
} from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

// Patient endpoints
@Controller('patients/appointments')
@UseGuards(RolesGuard)
@Roles(Role.PATIENT)
export class PatientAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findMyAppointments(
    @CurrentUser() user: JwtUserPayload,
    @Query() filterDto: PatientAppointmentFilterDto,
  ) {
    return this.appointmentsService.findByPatient(user.id, filterDto);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() createDto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(user.id, createDto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentsService.cancelByPatient(user.id, id, reason);
  }

  @Get(':id/medical-notes')
  getMedicalNotes(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentsService.getMedicalNotes(user.id, id, 'PATIENT');
  }
}

// Doctor endpoints
@Controller('doctors/appointments')
@UseGuards(RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findMyAppointments(
    @CurrentUser() user: JwtUserPayload,
    @Query() filterDto: AppointmentFilterDto,
  ) {
    return this.appointmentsService.findByDoctor(user.id, filterDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(user.id, id, updateDto);
  }

  @Patch(':id/medical-notes')
  updateMedicalNotes(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMedicalNotesDto,
  ) {
    return this.appointmentsService.updateMedicalNotes(user.id, id, updateDto);
  }

  @Get(':id/medical-notes')
  getMedicalNotes(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentsService.getMedicalNotes(user.id, id, 'DOCTOR');
  }

  @Patch(':id/payment')
  updatePaymentStatus(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePaymentStatusDto,
  ) {
    return this.appointmentsService.updatePaymentStatus(user.id, id, updateDto);
  }
}

// Secretary endpoints
@Controller('secretary/appointments')
@UseGuards(RolesGuard)
@Roles(Role.SECRETARY)
export class SecretaryAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('clinics')
  getMyClinics(@CurrentUser() user: JwtUserPayload) {
    return this.appointmentsService.getSecretaryClinics(user.id);
  }

  @Get()
  findClinicAppointments(
    @CurrentUser() user: JwtUserPayload,
    @Query() filterDto: AppointmentFilterDto,
  ) {
    return this.appointmentsService.findBySecretary(user.id, filterDto);
  }

  @Post()
  createForPatient(
    @CurrentUser() user: JwtUserPayload,
    @Body() createDto: CreateSecretaryAppointmentDto,
  ) {
    return this.appointmentsService.createBySecretary(user.id, createDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatusBySecretary(
      user.id,
      id,
      updateDto,
    );
  }

  @Patch(':id/payment')
  updatePaymentStatus(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePaymentStatusDto,
  ) {
    return this.appointmentsService.updatePaymentStatusBySecretary(
      user.id,
      id,
      updateDto,
    );
  }
}
