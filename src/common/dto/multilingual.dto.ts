import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MultilingualDto {
  @ApiProperty({ example: 'النص بالعربية' })
  @IsString()
  @MinLength(1)
  ar: string;

  @ApiProperty({ example: 'Text in English' })
  @IsString()
  @MinLength(1)
  en: string;
}

export class MultilingualOptionalDto {
  @ApiPropertyOptional({ example: 'النص بالعربية' })
  @IsOptional()
  @IsString()
  ar?: string;

  @ApiPropertyOptional({ example: 'Text in English' })
  @IsOptional()
  @IsString()
  en?: string;
}
