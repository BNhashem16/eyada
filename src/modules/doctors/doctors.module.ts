import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import {
  DoctorsController,
  AdminDoctorsController,
} from './doctors.controller';

@Module({
  controllers: [DoctorsController, AdminDoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
