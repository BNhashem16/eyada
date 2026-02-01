import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationMessages } from '../../../common';

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export class CreatePatientProfileDto {
  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '01012345678', description: 'Egyptian mobile number' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: JSON.stringify(ValidationMessages.WHATSAPP_INVALID),
  })
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  usePhoneAsWhatsapp?: boolean;

  @ApiPropertyOptional({ example: 'A+' })
  @IsOptional()
  @IsString()
  bloodType?: string;
}
