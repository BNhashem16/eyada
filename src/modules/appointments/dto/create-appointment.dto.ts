import {
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  clinicId: string;

  @IsUUID()
  serviceTypeId: string;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'appointmentTime must be in HH:mm format',
  })
  appointmentTime: string;

  @IsOptional()
  @IsUUID()
  patientProfileId?: string; // For booking for family members

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
