import { Module } from '@nestjs/common';
import {
  ServicesPublicController,
  DoctorServicesController,
} from './services.controller';
import { ServicesService } from './services.service';
import { PrismaModule } from '../../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesPublicController, DoctorServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
