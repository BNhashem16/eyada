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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CreateCityDto, UpdateCityDto } from './dto';
import { Public, Roles } from '../../../common/decorators';
import { RolesGuard } from '../../../common/guards';
import { Role } from '../../../common/enums';

@ApiTags('Cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  // Public - get all active cities
  @Public()
  @Get()
  findAll(@Query('stateId') stateId?: string) {
    return this.citiesService.findAll({ isActive: true, stateId });
  }

  // Public - get city by ID
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.citiesService.findById(id);
  }

  // Admin only - create city
  @ApiBearerAuth('JWT-auth')
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  // Admin only - update city
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCityDto: UpdateCityDto,
  ) {
    return this.citiesService.update(id, updateCityDto);
  }

  // Admin only - delete city
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.citiesService.remove(id);
  }
}
