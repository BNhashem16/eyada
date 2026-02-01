import {
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationMessages } from '../../../common';

export class CreateAppointmentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  clinicId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  serviceTypeId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: '10:30', description: 'Time in HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: JSON.stringify(ValidationMessages.APPOINTMENT_TIME_FORMAT),
  })
  appointmentTime: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'For booking for family members' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ example: 'Patient notes here', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
