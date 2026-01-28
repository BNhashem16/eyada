import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  Matches,
  Min,
  Max,
} from 'class-validator';

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export class CreatePatientProfileDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: 'WhatsApp number must be a valid Egyptian mobile number',
  })
  whatsappNumber?: string;

  @IsOptional()
  @IsBoolean()
  usePhoneAsWhatsapp?: boolean;

  @IsOptional()
  @IsString()
  bloodType?: string;
}
