import {
  IsUUID,
  IsBoolean,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultilingualDto } from '../../../../common/dto';

export class CreateCityDto {
  @IsUUID()
  stateId: string;

  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
