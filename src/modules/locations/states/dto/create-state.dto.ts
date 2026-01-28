import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultilingualDto } from '../../../../common/dto';

export class CreateStateDto {
  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @IsString()
  @MaxLength(10)
  code: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
