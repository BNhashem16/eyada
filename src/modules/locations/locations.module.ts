import { Module } from '@nestjs/common';
import { StatesService } from './states/states.service';
import { StatesController } from './states/states.controller';
import { CitiesService } from './cities/cities.service';
import { CitiesController } from './cities/cities.controller';

@Module({
  controllers: [StatesController, CitiesController],
  providers: [StatesService, CitiesService],
  exports: [StatesService, CitiesService],
})
export class LocationsModule {}
