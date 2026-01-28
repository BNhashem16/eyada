import {
  IsUUID,
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultilingualOptionalDto } from '../../../common/dto';

export class CreateDoctorProfileDto {
  @IsUUID()
  specialtyId: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  yearsOfExperience?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualOptionalDto)
  qualifications?: MultilingualOptionalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualOptionalDto)
  bio?: MultilingualOptionalDto;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsBoolean()
  showPhoneNumber?: boolean;

  @IsOptional()
  @IsBoolean()
  showWhatsappNumber?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatsappNumbers?: string[];
}
