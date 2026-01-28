import { Module } from '@nestjs/common';
import {
  SchedulesPublicController,
  DoctorSchedulesController,
} from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [SchedulesPublicController, DoctorSchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
