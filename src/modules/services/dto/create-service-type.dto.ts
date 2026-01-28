import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultilingualDto } from '../../../common/dto';

enum ServiceType {
  FIRST_VISIT = 'FIRST_VISIT',
  RE_VISIT = 'RE_VISIT',
  CONSULTATION_PHONE = 'CONSULTATION_PHONE',
  CONSULTATION_VIDEO = 'CONSULTATION_VIDEO',
}

export class CreateServiceTypeDto {
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualDto)
  name?: MultilingualDto;

  @IsNumber()
  @Min(0)
  @Max(100000)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(240)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  reVisitValidityDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
