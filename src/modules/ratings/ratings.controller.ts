import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';
import { JwtUserPayload } from '../../common/interfaces';

// Public endpoint for viewing doctor ratings
@Controller('doctors/:doctorId/ratings')
export class RatingsPublicController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Public()
  @Get()
  getDoctorRatings(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.ratingsService.findByDoctorPublic(
      doctorId,
      limit ? +limit : 10,
      offset ? +offset : 0,
    );
  }
}

// Patient endpoint for creating ratings
@Controller('patients/ratings')
@UseGuards(RolesGuard)
@Roles(Role.PATIENT)
export class PatientRatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() createDto: CreateRatingDto,
  ) {
    return this.ratingsService.create(user.id, createDto);
  }
}

// Doctor endpoint for viewing their ratings
@Controller('doctors/ratings')
@UseGuards(RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorRatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get()
  getMyRatings(@CurrentUser() user: JwtUserPayload) {
    return this.ratingsService.getMyRatings(user.id);
  }
}
