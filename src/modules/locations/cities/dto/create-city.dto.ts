import {
  IsUUID,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualDto } from '../../../../common/dto';

export class CreateCityDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  stateId: string;

  @ApiProperty({ type: MultilingualDto })
  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
