import {
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  Matches,
  MaxLength,
  IsEmail,
  IsMobilePhone,
} from 'class-validator';

export class CreateSecretaryAppointmentDto {
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

  @IsUUID()
  patientProfileId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  symptoms?: string;
}
