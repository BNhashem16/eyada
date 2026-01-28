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
} from '@nestjs/common';
import { StatesService } from './states.service';
import { CreateStateDto, UpdateStateDto } from './dto';
import { Public, Roles } from '../../../common/decorators';
import { RolesGuard } from '../../../common/guards';
import { Role } from '../../../common/enums';

@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  // Public - get all active states
  @Public()
  @Get()
  findAll() {
    return this.statesService.findAll({ isActive: true });
  }

  // Public - get state by ID
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.statesService.findById(id);
  }

  // Admin only - create state
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createStateDto: CreateStateDto) {
    return this.statesService.create(createStateDto);
  }

  // Admin only - update state
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStateDto: UpdateStateDto,
  ) {
    return this.statesService.update(id, updateStateDto);
  }

  // Admin only - delete state
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.statesService.remove(id);
  }
}
