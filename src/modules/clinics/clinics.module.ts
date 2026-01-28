import { Module } from '@nestjs/common';
import {
  ClinicsController,
  DoctorClinicsController,
} from './clinics.controller';
import { ClinicsService } from './clinics.service';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicsController, DoctorClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}
