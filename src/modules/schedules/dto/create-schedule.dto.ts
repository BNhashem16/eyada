import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationMessages } from '../../../common';

enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

export class ShiftDto {
  @ApiProperty({ example: '09:00', description: 'Time in HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: JSON.stringify(ValidationMessages.START_TIME_FORMAT),
  })
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'Time in HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: JSON.stringify(ValidationMessages.END_TIME_FORMAT),
  })
  endTime: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Break time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: JSON.stringify(ValidationMessages.BREAK_TIME_FORMAT),
  })
  breakTime?: string;
}

export class CreateScheduleDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.SUNDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiPropertyOptional({ example: '09:00', description: 'Time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: JSON.stringify(ValidationMessages.START_TIME_FORMAT),
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00', description: 'Time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: JSON.stringify(ValidationMessages.END_TIME_FORMAT),
  })
  endTime?: string;

  @ApiPropertyOptional({ type: [ShiftDto], description: 'Multiple shifts for the day' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts?: ShiftDto[];

  @ApiPropertyOptional({ example: 15, minimum: 5, maximum: 120, description: 'Slot duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  slotDuration?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
