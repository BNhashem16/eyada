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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualDto } from '../../../common/dto';

enum ServiceType {
  FIRST_VISIT = 'FIRST_VISIT',
  RE_VISIT = 'RE_VISIT',
  CONSULTATION_PHONE = 'CONSULTATION_PHONE',
  CONSULTATION_VIDEO = 'CONSULTATION_VIDEO',
}

export class CreateServiceTypeDto {
  @ApiProperty({ enum: ServiceType, example: ServiceType.FIRST_VISIT })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ type: MultilingualDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualDto)
  name?: MultilingualDto;

  @ApiProperty({ example: 200, minimum: 0, maximum: 100000 })
  @IsNumber()
  @Min(0)
  @Max(100000)
  price: number;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 240, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(240)
  duration?: number;

  @ApiPropertyOptional({ example: 14, minimum: 1, description: 'Re-visit validity in days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  reVisitValidityDays?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
