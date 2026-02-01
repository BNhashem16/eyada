import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MultilingualField {
  @ApiProperty({ example: 'الاسم بالعربية' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  ar: string;

  @ApiProperty({ example: 'Name in English' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  en: string;
}

export class CreateClinicDto {
  @ApiProperty({ type: MultilingualField })
  @ValidateNested()
  @Type(() => MultilingualField)
  name: MultilingualField;

  @ApiPropertyOptional({ type: MultilingualField })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualField)
  address?: MultilingualField;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  cityId: string;

  @ApiPropertyOptional({ example: '01012345678', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 30.0444, minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 31.2357, minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 60, default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
