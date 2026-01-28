import { Module } from '@nestjs/common';
import {
  PatientAppointmentsController,
  DoctorAppointmentsController,
} from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [PatientAppointmentsController, DoctorAppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
