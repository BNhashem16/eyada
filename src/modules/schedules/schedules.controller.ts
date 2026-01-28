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
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

// Public endpoint for getting available slots
@Controller('clinics')
export class SchedulesPublicController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Public()
  @Get(':clinicId/schedules')
  getSchedules(@Param('clinicId', ParseUUIDPipe) clinicId: string) {
    return this.schedulesService.findByClinic(clinicId);
  }

  @Public()
  @Get(':clinicId/available-slots')
  getAvailableSlots(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('date') dateStr: string,
  ) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return this.schedulesService.getAvailableSlots(clinicId, date);
  }
}

// Doctor management of schedules
@Controller('doctors/clinics/:clinicId/schedules')
@UseGuards(RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorSchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtUserPayload,
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ) {
    return this.schedulesService.findByClinic(clinicId);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUserPayload,
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() createDto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(user.id, clinicId, createDto);
  }

  @Patch(':scheduleId')
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() updateDto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(user.id, scheduleId, updateDto);
  }

  @Delete(':scheduleId')
  remove(
    @CurrentUser() user: JwtUserPayload,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ) {
    return this.schedulesService.delete(user.id, scheduleId);
  }
}
