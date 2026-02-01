import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';

export class AppointmentFilterDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  date?: string; // Single date: YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  dateFrom?: string; // Date range start: YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  dateTo?: string; // Date range end: YYYY-MM-DD

  @IsOptional()
  @IsString()
  search?: string; // Search by patient name or booking number

  @IsOptional()
  @IsUUID()
  serviceTypeId?: string;

  @IsOptional()
  @Type(() => Boolean)
  upcoming?: boolean; // Only show upcoming appointments (from today onwards)
}

export class PatientAppointmentFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @Type(() => Boolean)
  upcoming?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  forFamilyMember?: boolean; // Filter by self or family member
}
