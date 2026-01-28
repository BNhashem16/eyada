import { Module } from '@nestjs/common';
import {
  RatingsPublicController,
  PatientRatingsController,
  DoctorRatingsController,
} from './ratings.controller';
import { RatingsService } from './ratings.service';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [
    RatingsPublicController,
    PatientRatingsController,
    DoctorRatingsController,
  ],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
