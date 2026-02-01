import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualDto } from '../../../common/dto';

export class CreateSpecialtyDto {
  @ApiProperty({ type: MultilingualDto })
  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @ApiPropertyOptional({ type: MultilingualDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualDto)
  description?: MultilingualDto;

  @ApiPropertyOptional({ example: 'heart-icon' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
