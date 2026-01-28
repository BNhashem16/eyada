import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultilingualDto } from '../../../common/dto';

export class CreateSpecialtyDto {
  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualDto)
  description?: MultilingualDto;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
