import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';

export class AppointmentFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, example: 'PENDING' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, example: 'PENDING' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Single date filter' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Date range start' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-01-31', description: 'Date range end' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 'Ahmed', description: 'Search by patient name or booking number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  serviceTypeId?: string;

  @ApiPropertyOptional({ example: true, description: 'Only show upcoming appointments' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  upcoming?: boolean;
}

export class PatientAppointmentFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, example: 'PENDING' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, example: 'PENDING' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ example: true, description: 'Only show upcoming appointments' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  upcoming?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Filter by self or family member' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  forFamilyMember?: boolean;
}
