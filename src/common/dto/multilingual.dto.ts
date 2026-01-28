import { IsString, MinLength, IsOptional } from 'class-validator';

export class MultilingualDto {
  @IsString()
  @MinLength(1)
  ar: string;

  @IsString()
  @MinLength(1)
  en: string;
}

export class MultilingualOptionalDto {
  @IsOptional()
  @IsString()
  ar?: string;

  @IsOptional()
  @IsString()
  en?: string;
}
