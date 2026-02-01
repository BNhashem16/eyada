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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualOptionalDto } from '../../../common/dto';

export class CreateDoctorProfileDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  specialtyId: string;

  @ApiPropertyOptional({ example: 'LIC-12345' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 70 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ type: MultilingualOptionalDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualOptionalDto)
  qualifications?: MultilingualOptionalDto;

  @ApiPropertyOptional({ type: MultilingualOptionalDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualOptionalDto)
  bio?: MultilingualOptionalDto;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  showPhoneNumber?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  showWhatsappNumber?: boolean;

  @ApiPropertyOptional({ example: ['01012345678'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatsappNumbers?: string[];
}
