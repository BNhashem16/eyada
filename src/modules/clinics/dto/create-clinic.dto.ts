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

class MultilingualField {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  ar: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  en: string;
}

export class CreateClinicDto {
  @ValidateNested()
  @Type(() => MultilingualField)
  name: MultilingualField;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualField)
  address?: MultilingualField;

  @IsUUID()
  cityId: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  slotDurationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
