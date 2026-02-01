import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualDto } from '../../../../common/dto';

export class CreateStateDto {
  @ApiProperty({ type: MultilingualDto })
  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @ApiProperty({ example: 'CAI', maxLength: 10 })
  @IsString()
  @MaxLength(10)
  code: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
