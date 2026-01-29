import { Module } from '@nestjs/common';
import {
  PatientAppointmentsController,
  DoctorAppointmentsController,
  SecretaryAppointmentsController,
} from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [
    PatientAppointmentsController,
    DoctorAppointmentsController,
    SecretaryAppointmentsController,
  ],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
